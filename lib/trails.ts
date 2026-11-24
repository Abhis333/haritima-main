import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Lang } from "@/lib/i18n/dictionaries";
import { pick } from "@/lib/i18n/pick";
import { haversine } from "@/lib/geo";

export type TrailStopPoint = {
  id: string;
  position: number;
  slug: string;
  name: string;
  scientificName: string;
  note: string | null;
  campusArea: string;
  latitude: number;
  longitude: number;
  isApproximate: boolean;
};

export const DEFAULT_TRAIL_COLOR = "#2F6B4F";
// Typical walking pace plus a short pause at each stop.
const WALK_KM_PER_H = 4;
const MIN_PER_STOP = 2;

/** Route length (straight lines between consecutive stops) and an estimated walking time. */
export function routeStats(stops: { latitude: number; longitude: number }[]) {
  let metres = 0;
  for (let i = 1; i < stops.length; i++) metres += haversine(stops[i - 1], stops[i]);
  const minutes = Math.max(5, Math.round((metres / 1000 / WALK_KM_PER_H) * 60 + stops.length * MIN_PER_STOP));
  return { km: Math.round(metres / 100) / 10, minutes };
}

const stopLocation = {
  location: { include: { plant: { select: { slug: true, commonName: true, hindiName: true, scientificName: true } } } },
} satisfies Prisma.TrailStopInclude;
const stopInclude = { orderBy: { position: "asc" }, include: stopLocation } satisfies Prisma.Trail$stopsArgs;

type StopRow = Prisma.TrailStopGetPayload<{ include: typeof stopLocation }>;

function toPoint(s: StopRow, lang: Lang): TrailStopPoint {
  const p = s.location.plant;
  return {
    id: s.id,
    position: s.position,
    slug: p.slug,
    name: lang === "hi" && p.hindiName ? p.hindiName : p.commonName,
    scientificName: p.scientificName,
    note: pick(lang, s.note ?? "", s.noteHi) || null,
    campusArea: s.location.campusArea,
    latitude: s.location.latitude,
    longitude: s.location.longitude,
    isApproximate: s.location.isApproximate,
  };
}

export async function getTrails(lang: Lang) {
  const trails = await prisma.trail.findMany({ where: { published: true }, include: { stops: stopInclude }, orderBy: { title: "asc" } });
  return trails.map((t) => {
    const stops = t.stops.map((s) => toPoint(s, lang));
    return {
      slug: t.slug,
      title: pick(lang, t.title, t.titleHi),
      description: pick(lang, t.description, t.descriptionHi),
      color: t.color ?? DEFAULT_TRAIL_COLOR,
      stops,
      ...routeStats(stops),
    };
  });
}

export async function getTrail(slug: string, lang: Lang) {
  const t = await prisma.trail.findFirst({ where: { slug, published: true }, include: { stops: stopInclude } });
  if (!t) return null;
  const stops = t.stops.map((s) => toPoint(s, lang));
  return {
    slug: t.slug,
    title: pick(lang, t.title, t.titleHi),
    description: pick(lang, t.description, t.descriptionHi),
    color: t.color ?? DEFAULT_TRAIL_COLOR,
    stops,
    ...routeStats(stops),
  };
}
