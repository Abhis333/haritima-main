# Plant catalogue and search

Browse, filter and search the campus plant collection; each plant has a detail page.

## Files
- Pages: `app/(public)/plants/page.tsx` (list + filters), `app/(public)/plants/[slug]/page.tsx` (detail, `generateMetadata`), `app/(public)/plants/loading.tsx`, home page `app/(public)/page.tsx` (featured plants, category counts, stats)
- Components: `PlantCard`, `PlantFilters`, `PlantImage` (botanical placeholder when `imageUrl` is empty)
- API: `app/api/plants/route.ts` (GET list, admin POST), `app/api/plants/[id]/route.ts` (GET by id **or** slug, admin PUT/DELETE), `app/api/categories/*`, `app/api/stats/route.ts`
- Logic: `lib/search.ts` (`findPlants`, `searchPlantIds`, `tokenize`, `toTsQuery`), `lib/validation.ts` (`plantSchema`, `plantQuerySchema`, `categorySchema`)

## Data
- `Plant`: names (common, scientific, Hindi, Sanskrit, `otherNames[]`), `family`, `plantType` enum, `availability` enum, `description`/`descriptionHi`, `ayurvedicProperties`, `traditionalUses[]`/`traditionalUsesHi[]`, `plantParts[]`, preparation, cultivation, precautions, image, `featured`.
- `PlantCategory`: `slug`, `nameEn`/`nameHi`, optional lucide `icon` and hex `color` (the color is also used for map markers; a blank color is saved as null and the map falls back to `#4e7a3a`). Many-to-many with `Plant`.
- The "medicinal" stat counts plants in categories with slug `medicinal` or `ayurvedic`.

## How search works
- Filters: `q`, `category` (slug), `type`, `availability`, `area` (a location's `campusArea`), `use` (a benefit's `concern`), `page`, `pageSize` (max 60).
- `q` goes through `tokenize()`: lowercases, drops stopwords (English, Hindi function words such as के/से/में/लिए, and common romanised Hindi such as ke/liye/paudhe), lightly stems English words, and expands them through the `SYNONYMS` map (for example sleep → nidra / नींद). It then becomes an OR prefix tsquery.
- `searchPlantIds` runs raw SQL: PostgreSQL `simple` full-text search over the concatenated plant fields, plus ILIKE on the names, capped at 200 results.
- When `q` is set, results are sorted by rank in memory and paginated after that. Otherwise pagination happens in the database, ordered by `featured desc, commonName asc`.
- The GET list response is cached at the CDN (`s-maxage=60, stale-while-revalidate=300`).

## Notes
- The slug comes from `slugify(commonName)`. If that slug is taken, a base-36 timestamp is appended.
- Creating or updating a plant calls `indexPlant()` in the background (not awaited) and writes an audit entry.
- The detail page shows VERIFIED references first, then PENDING ones with a "pending" badge. REJECTED references are never shown.

## Seed data
- `prisma/seed.ts` (`npm run db:seed`): categories, the 10 core plants and mantras. Re-running it **resets** benefits, references and locations of those 10 plants.
- `prisma/seed-extra.ts` (`npm run db:seed-extra`): 16 more plants (Peepal, Banyan, Bael, Haritaki, Bibhitaki, Vasaka, Turmeric, Ginger, Mint, Ashoka, Hibiscus, Moringa, Kalmegh, Punarnava, Shankhpushpi, Marigold). Add-only: existing slugs are skipped. All references PENDING, all locations approximate.
- After either script, run Admin → Knowledge → Reindex so the chatbot gets embeddings. `lib/eval.ts` expected plants include both sets.

## Hindi spelling variants
- `normalizeHindi()` in `lib/search.ts` folds queries (NFC, chandrabindu ँ → anusvara ं, nukta and zero-width joiners removed); `hindiFoldSql()` applies the same folding to stored text in SQL, for the catalogue search (`searchPlantIds`, including Hindi/Sanskrit name ILIKE) and the chatbot chunk full-text search (`lib/rag.ts`). So "खाँसी" and "खांसी", or "कब्ज़" and "कब्ज", match. Stop-words and synonym keys/values are folded the same way; Hindi synonym keys map to English terms.
