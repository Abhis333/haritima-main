# Campus walking trails

Guided walks through campus plants ("Medicinal Garden Walk", "Sacred Trees Trail"), drawn on the map with numbered stops and a short note at each.

## Files
- Pages: `app/(public)/trails/page.tsx` (list), `app/(public)/trails/[slug]/page.tsx` (map + ordered stop list)
- Data: `lib/trails.ts` (`getTrails(lang)`, `getTrail(slug, lang)`, `routeStats()`)
- Map: `components/TrailMap.tsx` (numbered markers, dashed route line, popups), loaded client-only via `components/TrailMapLoader.tsx`. Tiles come from `TILE_URL` / `TILE_ATTRIBUTION` exported by `components/PlantMap.tsx`.
- API: `app/api/trails/route.ts` (public GET of published trails; admin POST), `app/api/trails/[id]/route.ts`, `app/api/trail-stops/route.ts` and `[id]/route.ts` (admin only). All writes go through `adminCrud` (audit-logged, no re-index: trails are not part of the RAG knowledge).
- Admin: `app/admin/trails/page.tsx` (trails), `app/admin/trails/stops/page.tsx` (stops). Sidebar: "Walking trails".
- Seed: `prisma/seed-seasons-trails.ts` (`npm run db:seed-trails`), add-only by slug.

## Data
- `Trail`: `slug`, `title`/`titleHi`, `description`/`descriptionHi`, `color` (route colour; blank = `#2F6B4F`), `published`.
- `TrailStop`: `trailId`, `locationId` → `PlantLocation`, `position` (walking order), `note`/`noteHi`. Deleting a trail or a location deletes its stops (cascade).
- Stops point at plant locations, so correcting a location with GPS moves the stop too.

## Behaviour
- Distance is the sum of straight lines between consecutive stops; time assumes 4 km/h plus 2 minutes per stop (minimum 5 minutes). Both are estimates.
- Stops on approximate locations get a dashed marker ring and the page shows a "route is a guide" note.
- The seed orders stops as a nearest-neighbour walk from the first stop; admins can renumber them.
- Route colour must be dark enough for white stop numbers.
