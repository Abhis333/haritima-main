// Small geometry helpers, safe for client and server.

type Pt = { latitude: number; longitude: number };
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in metres. */
export function haversine(a: Pt, b: Pt) {
  const R = 6_371_000;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Initial compass bearing from a to b, 0-360 degrees (0 = north). */
export function bearing(a: Pt, b: Pt) {
  const y = Math.sin(rad(b.longitude - a.longitude)) * Math.cos(rad(b.latitude));
  const x = Math.cos(rad(a.latitude)) * Math.sin(rad(b.latitude)) - Math.sin(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.cos(rad(b.longitude - a.longitude));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Index 0-7 into N, NE, E, SE, S, SW, W, NW. */
export const compassIndex = (deg: number) => Math.round(deg / 45) % 8;

/** Walking minutes at about 4 km/h, at least 1. */
export const walkMinutes = (metres: number) => Math.max(1, Math.round(metres / 67));

/** Google Maps walking directions to a point (opens the app on phones). */
export const googleDirectionsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
