# Campus map and plant locations

An interactive Leaflet / OpenStreetMap map with every documented plant pinned to its campus location.

## Files
- Pages: `app/(public)/map/page.tsx` (`?plant=<slug>` focuses one plant), home page map section in `app/(public)/page.tsx`
- Components: `components/PlantMap.tsx` (Leaflet, exports the `MapPoint` type), `components/PlantMapLoader.tsx` (`next/dynamic` with `ssr: false`, because Leaflet needs `window`)
- Data: `lib/map-data.ts` (`getMapPoints(lang)`, which flattens locations, plants and first categories into `MapPoint[]`)
- API: `app/api/locations/route.ts` (GET, optional `?plantId=`; admin POST), `app/api/locations/[id]/route.ts` (admin PUT/DELETE through `adminCrud`, with re-indexing)
- Admin: `app/admin/locations/page.tsx`. Its form includes `components/admin/LocateButton.tsx` (passed through `ResourceManager`'s `formExtras` slot): "Use my current location" watches the device GPS for up to 15 s, keeps the most accurate reading, fills latitude/longitude (6 decimals) and unticks `isApproximate` only when accuracy is ±20 m or better. It needs a secure context (HTTPS or localhost); `next.config.ts` allows `geolocation=(self)`.

## Getting to a plant
- Live guiding (`components/MapGuide.tsx`): "Guide me here" in a map popup, or `/map?plant=<slug>&guide=1` (linked from the plant page), watches the device position and draws your position, its accuracy circle and a straight direction line to the plant. A panel shows the compass direction, distance and walking time (`lib/geo.ts`), and says when you have arrived (within 12–30 m depending on GPS accuracy). Guiding stops when the panel is closed or the page is left.
- There is no campus footpath data, so the line shows direction only, not a route along paths. Positions outside `CAMPUS_BOUNDS` get an "outside the campus map" message instead.
- "Directions" opens Google Maps walking directions to the plant's coordinates (popup, guide panel, plant page), for reaching the campus or following roads.
- Needs a secure context (https or localhost) and location permission; errors are shown in the panel.

## Field survey with photos
- The admin Locations form has a "Photos of the plant at this spot" field (`components/admin/PhotosUploadField.tsx`, ResourceManager field type `photos`): up to `MAX_LOCATION_PHOTOS` (6) images, uploaded through `/api/upload`. Photos are shrunk in the browser to a JPEG of at most 1600 px first, so phone photos stay under the 5 MB limit.
- "Use my current location" also strips the seed's "(approximate — to be confirmed with GPS)" note from the description when the reading is surveyed (±20 m or better).
- Public display: the plant page lists each spot's photos under "On campus" and uses the first spot photo as the hero image when the plant has no `imageUrl`; map popups prefer the spot photo over the plant photo (`lib/map-data.ts`).

## Data
- `PlantLocation`: `plantId`, `latitude`, `longitude`, `isApproximate` (default `true`), `campusArea`, `locationDescription`, `landmark`, `photos` (`String[]`, default `[]`; `locationSchema` leaves them unchanged when absent from an update). It is deleted when its plant is deleted (cascade).
- Marker color comes from the plant's first category `color`, falling back to `#4e7a3a`.

## Config
- `NEXT_PUBLIC_MAP_URL`: tile URL template. Defaults to the muted CARTO Voyager basemap (OpenStreetMap data, free with attribution, no key); a custom URL gets OpenStreetMap-only attribution.

## Campus-only view
- `CAMPUS_BOUNDS` in `components/PlantMap.tsx` is a box of about ±650 m around `CAMPUS_CENTER` (DSVV, 29.998143, 78.192779). `CAMPUS_MAP_PROPS` (used by both the plant map and `TrailMap`) sets `maxBounds` with full viscosity and `minZoom` 16, so the map can't be panned or zoomed out off campus. Tiles load only inside the box.
- A location saved outside the box can't be reached on the map; widen the offsets if the campus needs more room.

## Look
- Markers are small circles in the category colour with a white ring; approximate locations have a dashed ring, and the focused plant is drawn larger.
- The legend is a panel at the top right listing each category with its plant count; clicking one filters the map.
- Popups show photo, category, names, a short description, the location row and a "View plant" link. Styles live in `app/globals.css` (`.leaflet-*`).
- The map page shows plant and campus-area counts above the map and a per-area list below it.
- `NEXT_PUBLIC_CAMPUS_LAT` / `NEXT_PUBLIC_CAMPUS_LNG`: map center (defaults to roughly DSVV, Haridwar).

## Notes
- All seed coordinates are **approximate placeholders**. The UI badges them as "approximate" until an admin records a real GPS reading and unticks `isApproximate`.
- The admin dashboard lists plants that have no location yet.
- Location changes re-index the plant, because the campus area is part of the RAG plant chunk. Moving a location to another plant re-indexes both plants.
- The latitude/longitude inputs use `step="any"`, so coordinates pasted from Google Maps with more than 6 decimals are accepted.
