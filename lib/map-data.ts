import { prisma } from "@/lib/prisma";
import type { Lang } from "@/lib/i18n/dictionaries";
import type { MapPoint } from "@/components/PlantMap";
import type { PlacePoint } from "@/lib/places";

/** Campus places for the map, in the visitor's language. A failure here must not take the plant map down. */
export async function getCampusPlaces(lang: Lang): Promise<PlacePoint[]> {
  const rows = await prisma.campusPlace.findMany({ orderBy: { name: "asc" } }).catch((e: unknown) => {
    console.error("Could not load campus places", e);
    return [];
  });
  return rows.map((p) => {
    const hindi = lang === "hi" && p.nameHi;
    return {
      id: p.id,
      name: hindi ? p.nameHi! : p.name,
      altName: hindi ? p.name : p.nameHi,
      kind: p.kind,
      description: lang === "hi" && p.descriptionHi ? p.descriptionHi : p.description,
      imageUrl: p.photos[0] ?? null,
      latitude: p.latitude,
      longitude: p.longitude,
      isApproximate: p.isApproximate,
    };
  });
}

export async function getMapPoints(lang: Lang): Promise<MapPoint[]> {
  const locations = await prisma.plantLocation.findMany({
    include: { plant: { include: { categories: { take: 1 } } } },
    orderBy: { campusArea: "asc" },
  });
  return locations.map((l) => {
    const c = l.plant.categories[0];
    return {
      id: l.id,
      slug: l.plant.slug,
      commonName: l.plant.commonName,
      hindiName: l.plant.hindiName,
      scientificName: l.plant.scientificName,
      description: lang === "hi" && l.plant.descriptionHi ? l.plant.descriptionHi : l.plant.description,
      // A photo taken at this spot beats the plant's general photo.
      imageUrl: l.photos[0] ?? l.plant.imageUrl,
      category: c ? (lang === "hi" ? c.nameHi : c.nameEn) : "Other",
      categorySlug: c?.slug ?? "other",
      color: c?.color ?? "#4e7a3a",
      latitude: l.latitude,
      longitude: l.longitude,
      campusArea: l.campusArea,
      locationDescription: l.locationDescription,
      landmark: l.landmark,
      isApproximate: l.isApproximate,
    };
  });
}
