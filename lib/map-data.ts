import { prisma } from "@/lib/prisma";
import type { Lang } from "@/lib/i18n/dictionaries";
import type { MapPoint } from "@/components/PlantMap";

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
