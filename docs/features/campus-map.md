# Campus map and plant locations

An interactive Leaflet map on a Google-like vector basemap (OpenFreeMap "Liberty", OpenStreetMap data) with every documented plant pinned to its campus location, named campus places (temples, buildings, gates …), "Show my location" and turn-by-turn walking routes.

## Files
- Pages: `app/(public)/map/page.tsx` (`?plant=<slug>` focuses one plant), home page map section in `app/(public)/page.tsx`
- Components: `components/PlantMap.tsx` (Leaflet, exports the `MapPoint` type), `components/PlantMapLoader.tsx` (`next/dynamic` with `ssr: false`, because Leaflet needs `window`), `components/map/Basemap.tsx` (vector basemap), `components/map/markers.ts` (teardrop plant pins, labelled place icons), `components/MapGuide.tsx` (live location, walking route, guide panel)
- Shared: `lib/campus.ts` (`CAMPUS_CENTER`, `CAMPUS_BOUNDS`, `CAMPUS_MAP_PROPS`, `insideCampus`), `lib/route.ts` (route types, OSRM parsing, progress along the route), `lib/places.ts` (place kinds, colours, `PlacePoint`)
- Data: `lib/map-data.ts` (`getMapPoints(lang)`, which flattens locations, plants and first categories into `MapPoint[]`; `getCampusPlaces(lang)`, which logs and returns `[]` if places cannot be loaded, so the plant map still works)
- API: `app/api/walk-route/route.ts` (public GET walking route, see below), `app/api/places/route.ts` + `[id]` (GET public; admin POST/PUT/DELETE through `adminCrud`, no re-index), `app/api/locations/route.ts` (GET, optional `?plantId=`; admin POST), `app/api/locations/[id]/route.ts` (admin PUT/DELETE through `adminCrud`, with re-indexing)
- Admin: `app/admin/locations/page.tsx`. Its form includes `components/admin/LocateButton.tsx` (passed through `ResourceManager`'s `formExtras` slot): "Use my current location" watches the device GPS for up to 15 s, keeps the most accurate reading, fills latitude/longitude (6 decimals) and unticks `isApproximate` only when accuracy is ±20 m or better. It needs a secure context (HTTPS or localhost); `next.config.ts` allows `geolocation=(self)`.

## Getting to a plant or place
- Live guiding (`components/MapGuide.tsx`): "Guide me here" in a plant or place popup, or `/map?plant=<slug>&guide=1` (linked from the plant page), watches the device position and draws your position and its accuracy circle.
- Walking route: on the first on-campus fix the browser calls `GET /api/walk-route?from=lat,lng&to=lat,lng`. The server (rate limit 30/min per client, 8 s timeout) asks the public OSRM foot-routing server of FOSSGIS (`routing.openstreetmap.de`, OpenStreetMap paths, free, fair use, no key; override with `WALK_ROUTE_URL`) and returns `{ path, steps }`. Both points must be inside `CAMPUS_BOUNDS` (422 otherwise). Because of the proxy the routing service never sees the visitor's IP; nothing is stored.
- The route is drawn Google-style (blue line with a white casing), with dotted links from you to the path and from the path's end to the target. The panel shows the next maneuver ("Turn right", "In 40 m"), the remaining distance along the route and the walking time (about 4 km/h), and an "All steps" list. Leaving the route by more than 30 m requests a new one (at most every 15 s).
- If the route service fails, guidance falls back to the straight direction line with compass direction and distance (retried after 30 s). Arrival (within 12–30 m depending on GPS accuracy) uses the straight-line distance. Guiding stops when the panel is closed or the page is left. Positions outside `CAMPUS_BOUNDS` get an "outside the campus map" message.
- "Show my location" (round button, bottom right) shows the blue dot without guiding and flies to it once; off campus it shows a short message.
- Only paths mapped in OpenStreetMap can be routed; small garden paths may be missing, and approximate plant spots make the last metres approximate too.
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
- `NEXT_PUBLIC_MAP_STYLE`: MapLibre style URL (default OpenFreeMap Liberty: free, no key, attribution required).
- `NEXT_PUBLIC_MAP_URL`: optional raster tile template; when set it **replaces** the vector style. Leave it unset for the Liberty map. (The old CARTO default now answers "API key required".)
- `WALK_ROUTE_URL`: optional OSRM-compatible `/route/v1/<profile>` base URL for walking routes (server-side).

## Campus places
- `CampusPlace` (migration `20261127120000_campus_places`): `name`, `nameHi`, `kind` (`PlaceKind`: TEMPLE, ACADEMIC, LIBRARY, HOSTEL, CANTEEN, OFFICE, GATE, GARDEN, HEALTH, SPORTS, OTHER), `description`, `descriptionHi`, `latitude`, `longitude`, `isApproximate`, `photos` (up to 6).
- Admin: `app/admin/places/page.tsx` (sidebar "Campus places"), with the same GPS button and photo field as plant locations. `placeSchema` requires the point to be inside `CAMPUS_BOUNDS`. Changes are audit-logged (`CampusPlace`); places are not part of the chatbot knowledge base.
- Map: a round icon in the kind's colour with the name as a label; the popup shows photo, kind, names, description and "Guide me here". The legend has a "Show campus places" toggle.
- Why: OpenStreetMap has the campus building outlines but almost no names (on 27 Nov 2026 only "Veda Vyas Mandir" and Gates 2–5 were named), so places are recorded in Haritima.

## Campus-only view
- `CAMPUS_BOUNDS` in `lib/campus.ts` is a box of about ±650 m around `CAMPUS_CENTER` (DSVV, 29.998143, 78.192779). `CAMPUS_MAP_PROPS` (used by both the plant map and `TrailMap`) sets `maxBounds` with full viscosity and `minZoom` 16, so the map can't be panned or zoomed out off campus.
- A location saved outside the box can't be reached on the map; widen the offsets if the campus needs more room.

## Look
- Basemap: `components/map/Basemap.tsx` renders the MapLibre vector style (`NEXT_PUBLIC_MAP_STYLE`, default `https://tiles.openfreemap.org/styles/liberty`) under Leaflet through `@maplibre/maplibre-gl-leaflet`, so markers, bounds and guidance stay Leaflet. Without WebGL, or if the style fails before loading, it falls back to standard OpenStreetMap raster tiles. Setting `NEXT_PUBLIC_MAP_URL` (a raster tile template) replaces the vector style. `maplibre-gl` is pinned to 5.x because 6.x loads its worker from a separate file that the Next.js bundler does not pick up.
- Plant markers are Google-style teardrop pins in the category colour; approximate locations have a dashed outline, and the focused plant is drawn larger.
- The legend is a panel at the top right listing each category with its plant count; clicking one filters the map.
- Popups show photo, category, names, a short description, the location row and a "View plant" link. Styles live in `app/globals.css` (`.leaflet-*`).
- The map page shows plant and campus-area counts above the map and a per-area list below it.
- `NEXT_PUBLIC_CAMPUS_LAT` / `NEXT_PUBLIC_CAMPUS_LNG`: map center (defaults to roughly DSVV, Haridwar).

## Notes
- All seed coordinates are **approximate placeholders**. The UI badges them as "approximate" until an admin records a real GPS reading and unticks `isApproximate`.
- The admin dashboard lists plants that have no location yet.
- Location changes re-index the plant, because the campus area is part of the RAG plant chunk. Moving a location to another plant re-indexes both plants.
- The latitude/longitude inputs use `step="any"`, so coordinates pasted from Google Maps with more than 6 decimals are accepted.
