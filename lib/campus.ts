// Campus geometry shared by the maps (client) and the walking-route API (server). No secrets here.

// DSVV campus centre, Haridwar (Wikipedia: 29°59′53″N 78°11′34″E). Replace with a surveyed point if needed.
export const CAMPUS_CENTER: [number, number] = [
  Number(process.env.NEXT_PUBLIC_CAMPUS_LAT ?? 29.998143),
  Number(process.env.NEXT_PUBLIC_CAMPUS_LNG ?? 78.192779),
];

// Box of roughly 650 m each way around the campus centre. The maps can't be panned or zoomed out past it,
// so only the DSVV campus is shown. Widen the offsets if a plant or place falls outside.
export const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [CAMPUS_CENTER[0] - 0.006, CAMPUS_CENTER[1] - 0.0068],
  [CAMPUS_CENTER[0] + 0.006, CAMPUS_CENTER[1] + 0.0068],
];

/** Shared MapContainer props that keep a map on campus. */
export const CAMPUS_MAP_PROPS = { center: CAMPUS_CENTER, zoom: 17, minZoom: 16, maxZoom: 19, maxBounds: CAMPUS_BOUNDS, maxBoundsViscosity: 1 } as const;

export const insideCampus = (lat: number, lng: number) => {
  const [[s, w], [n, e]] = CAMPUS_BOUNDS;
  return lat >= s && lat <= n && lng >= w && lng <= e;
};
