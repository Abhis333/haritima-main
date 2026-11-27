import { handle, HttpError } from "@/lib/guards";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { insideCampus } from "@/lib/campus";
import { fromOsrm } from "@/lib/route";

// Public OSRM server with a walking profile, run by FOSSGIS on OpenStreetMap data (free, fair use, no key).
// Override with WALK_ROUTE_URL (same OSRM API) if another provider is used.
const OSRM = process.env.WALK_ROUTE_URL || "https://routing.openstreetmap.de/routed-foot/route/v1/foot";

const parse = (raw: string | null) => {
  const [lat, lng] = (raw ?? "").split(",").map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !insideCampus(lat, lng)) throw new HttpError(422, "Both points must be on the campus map.");
  return { lat, lng };
};

/**
 * GET /api/walk-route?from=lat,lng&to=lat,lng → { path, steps } along mapped campus paths.
 * Proxied through the server so the routing service never sees the visitor's IP address; nothing is stored.
 */
export const GET = handle(async (req: Request) => {
  const limit = rateLimit(`walk-route:${clientKey(req)}`, 30, 60_000);
  if (!limit.ok) throw new HttpError(429, "Too many route requests. Try again in a minute.");
  const url = new URL(req.url);
  const from = parse(url.searchParams.get("from"));
  const to = parse(url.searchParams.get("to"));
  const upstream = `${OSRM}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;
  const res = await fetch(upstream, { headers: { "User-Agent": "Haritima campus guide" }, signal: AbortSignal.timeout(8_000) }).catch(() => null);
  if (!res?.ok) throw new HttpError(502, "The walking-route service is not available right now.");
  const route = fromOsrm(await res.json());
  if (!route) throw new HttpError(404, "No walking route found between these points.");
  return Response.json(route, { headers: { "Cache-Control": "no-store" } });
});
