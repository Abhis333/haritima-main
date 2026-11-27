// Walking routes along mapped campus paths. Types and pure helpers, safe for client and server.
import { haversine } from "@/lib/geo";

type LatLng = [number, number];
export type RouteStep = {
  /** OSRM maneuver type: depart, turn, continue, new name, end of road, fork, roundabout, arrive, … */
  type: string;
  /** left, right, slight left, sharp right, straight, uturn, … (may be empty). */
  modifier: string;
  /** Street or path name, often empty on campus paths. */
  name: string;
  /** Index into `path` where this maneuver happens. */
  at: number;
};
export type WalkRoute = {
  /** Route geometry as [lat, lng] points, from the snapped start to the snapped end. */
  path: LatLng[];
  steps: RouteStep[];
};

const pt = ([latitude, longitude]: LatLng) => ({ latitude, longitude });

/** Index of the path vertex nearest to `p`. */
export function nearestIndex(path: LatLng[], p: LatLng) {
  let best = 0;
  let bestD = Infinity;
  path.forEach((v, i) => {
    const d = haversine(pt(v), pt(p));
    if (d < bestD) { bestD = d; best = i; }
  });
  return { index: best, offRoute: bestD };
}

/** Metres along the path from vertex `from` to vertex `to`. */
export function alongPath(path: LatLng[], from: number, to: number) {
  let m = 0;
  for (let i = from; i < to; i++) m += haversine(pt(path[i]), pt(path[i + 1]));
  return m;
}

/**
 * Where the walker is on the route: metres left to the destination, the next maneuver and the metres to it.
 * The remaining distance includes the walk from the walker to the path and from the path's end to the target.
 */
export function routeProgress(route: WalkRoute, me: LatLng, target: LatLng) {
  const { index, offRoute } = nearestIndex(route.path, me);
  const last = route.path.length - 1;
  const tail = haversine(pt(route.path[last]), pt(target));
  const remaining = offRoute + alongPath(route.path, index, last) + tail;
  const next = route.steps.find((s) => s.at > index && s.type !== "depart") ?? null;
  const toNext = next ? offRoute + alongPath(route.path, index, next.at) : remaining;
  return { remaining, offRoute, next, toNext };
}

/** Builds a WalkRoute from an OSRM /route response (geometries=geojson, steps=true). */
export function fromOsrm(json: unknown): WalkRoute | null {
  const r = (json as { routes?: { geometry?: { coordinates?: [number, number][] }; legs?: { steps?: { name?: string; maneuver?: { type?: string; modifier?: string; location?: [number, number] } }[] }[] }[] })?.routes?.[0];
  const coords = r?.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  const path: LatLng[] = coords.map(([lng, lat]) => [lat, lng]);
  const steps: RouteStep[] = (r.legs?.[0]?.steps ?? []).flatMap((s) => {
    const loc = s.maneuver?.location;
    if (!loc) return [];
    return [{ type: s.maneuver?.type ?? "", modifier: s.maneuver?.modifier ?? "", name: s.name ?? "", at: nearestIndex(path, [loc[1], loc[0]]).index }];
  });
  return { path, steps };
}
