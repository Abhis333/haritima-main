# Campus map and plant locations

An interactive Leaflet / OpenStreetMap map with every documented plant pinned to its campus location.

## Files
- Pages: `app/(public)/map/page.tsx` (`?plant=<slug>` focuses one plant), home page map section in `app/(public)/page.tsx`
- Components: `components/PlantMap.tsx` (Leaflet, exports the `MapPoint` type), `components/PlantMapLoader.tsx` (`next/dynamic` with `ssr: false`, because Leaflet needs `window`)
- Data: `lib/map-data.ts` (`getMapPoints(lang)`, which flattens locations, plants and first categories into `MapPoint[]`)
- API: `app/api/locations/route.ts` (GET, optional `?plantId=`; admin POST), `app/api/locations/[id]/route.ts` (admin PUT/DELETE through `adminCrud`, with re-indexing)
- Admin: `app/admin/locations/page.tsx`. Its form includes `components/admin/LocateButton.tsx` (passed through `ResourceManager`'s `formExtras` slot): "Use my current location" watches the device GPS for up to 15 s, keeps the most accurate reading, fills latitude/longitude (6 decimals) and unticks `isApproximate` only when accuracy is ±20 m or better. It needs a secure context (HTTPS or localhost); `next.config.ts` allows `geolocation=(self)`.

## Data
- `PlantLocation`: `plantId`, `latitude`, `longitude`, `isApproximate` (default `true`), `campusArea`, `locationDescription`, `landmark`. It is deleted when its plant is deleted (cascade).
- Marker color comes from the plant's first category `color`, falling back to `#4e7a3a`.

## Config
- `NEXT_PUBLIC_MAP_URL`: tile URL template (defaults to OpenStreetMap).
- `NEXT_PUBLIC_CAMPUS_LAT` / `NEXT_PUBLIC_CAMPUS_LNG`: map center (defaults to roughly DSVV, Haridwar).

## Notes
- All seed coordinates are **approximate placeholders**. The UI badges them as "approximate" until an admin records a real GPS reading and unticks `isApproximate`.
- The admin dashboard lists plants that have no location yet.
- Location changes re-index the plant, because the campus area is part of the RAG plant chunk.
