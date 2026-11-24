# Code quality review — 2026-10-26
Scope: Whole project, feature by feature per the CLAUDE.md Feature map (plants catalogue/search, RAG chatbot, plant identification, campus map, Ayurveda references, mantras, auth/users, admin dashboard/audit, uploads, feedback, i18n, security), with extra attention to the recent branch work: `lib/eval.ts` + evaluation page, GPS capture (`LocateButton`), printable reference verification sheet, chat model default.
Typecheck: pass (`tsc --noEmit`, no errors)   Lint: skipped — `next lint` has no ESLint config in the repo and stops at the interactive "How would you like to configure ESLint?" prompt (exit 0, nothing linted). Add an `eslint.config.mjs` (or migrate with `npx @next/codemod@canary next-lint-to-eslint-cli .`) so lint actually runs. Next also warns about two lockfiles (`..\package-lock.json` and `.\package-lock.json`); set `outputFileTracingRoot` or remove the outer one.

Invariants checked and holding: every mutating API calls `requireAdmin()` and `audit()`; plant/benefit/location/reference writes await `indexPlant()` (except the plant-move case in CQ-3); only VERIFIED references are indexed (`lib/rag.ts:8`) and attached to answers (`lib/chat.ts:186`); model-invented ids are dropped (`lib/chat.ts:218-219`); every `ChatAnswer` carries `DISCLAIMER`; the dictionaries are type-locked (`hi: Dictionary`) so key parity is enforced by TS. The `findPlants` pagination with `q` (sort by rank, then slice) is correct in the current code.

## Findings

### CQ-1 [High] Editing a benefit silently unlinks its (pending) reference
- Location: `app/admin/knowledge/page.tsx:12`, `app/admin/knowledge/page.tsx:47`, `components/admin/ResourceManager.tsx:114-118`, `lib/validation.ts:81`
- Problem: The "Supporting verified reference" select only offers VERIFIED references. When an admin edits a benefit whose `referenceId` points to a PENDING reference, no `<option>` matches the `defaultValue`, so the browser selects the first option, `—` (value `""`). On save, `benefitSchema` turns `""` into `null` and the PUT overwrites `referenceId`.
- Scenario: Every seeded benefit is linked to its plant's PENDING placeholder reference (`prisma/seed.ts` `referenceId: ref.id`). An admin opens Tulsi / "cough" in Admin → Knowledge, fixes a typo in the description, and saves. The link to the reference is erased with no warning. The new printable verification sheet (`app/admin/references/print/page.tsx:76-82`) then shows "None linked" under that reference, so faculty can no longer see which associations it is meant to support. It is also impossible to link a new benefit to a reference that is still pending, which is exactly the state the verification workflow starts in.
- Suggested fix: Load all non-REJECTED references for the options and label the status (`"Tulsi — Charaka Samhita (PENDING)"`). Alternatively, always include the row's current reference in the options. Rename the field label to "Supporting reference". Optionally, have the API reject a `referenceId` whose `plantId` differs from the benefit's `plantId` (see CQ-24).
- **Status:** fixed (`app/admin/knowledge/page.tsx`: options are every non-REJECTED reference plus any reference already linked by a benefit, labelled with status; field renamed "Supporting reference" with help text). The plant-mismatch server check is CQ-24 (Low) and was not done in this run.

### CQ-2 [Medium] Editing a VERIFIED reference keeps it VERIFIED and keeps the original verifier
- Location: `app/api/references/[id]/route.ts:14-21`
- Problem: `verifiedBy`/`verifiedAt` are set only when the status *changes* to VERIFIED. When the status stays VERIFIED, any change to `textName`, `chapter`, `section`, `verse` or `citation` is saved as verified and still attributed to the first verifier. Nothing forces a re-check.
- Scenario: Reference R is verified by faculty for "Sutrasthana 4, verse 12". Later an admin changes the verse to "14" (a guess) and saves without touching the status select, which still shows VERIFIED. The public plant page and every chatbot answer now show "verse 14" with the Verified badge and the original reviewer's attribution. That breaks "unverified references are never presented as verified".
- Suggested fix: In the PUT, compare the citation fields with `before`. If any of them changed while the status is VERIFIED, either reset to PENDING (clearing `verifiedBy`/`verifiedAt`) or require an explicit "re-verified" flag that re-stamps `verifiedBy`/`verifiedAt`. Record the changed fields in the audit details.
- **Status:** fixed (`app/api/references/[id]/route.ts`: if the reference was VERIFIED, stays VERIFIED and any of `plantId`, `textName`, `author`, `chapter`, `section`, `verse`, `citation`, `referenceUrl`, `sourceType` changed, it is saved as PENDING with `verifiedBy`/`verifiedAt` cleared; audit records `changed` and `resetToPending`; `app/admin/references/page.tsx` help text on the status field; `docs/features/ayurveda-references.md`).

### CQ-3 [Medium] Moving a location, benefit or reference to another plant leaves stale chunks on the old plant
- Location: `lib/crud.ts:17-19` + `lib/crud.ts:33-35`; `app/api/references/[id]/route.ts:13,24`
- Problem: After an update, only `row.plantId` (the **new** plant) is re-indexed. When `plantId` changes, the previous plant's `KnowledgeDocument`s still contain the moved benefit, location or reference text. This breaks the "any change … must re-index that plant" invariant for the source plant.
- Scenario: The admin notices that a "sleep" benefit was entered on Neem by mistake and changes its Plant to Brahmi. Brahmi is re-indexed, but Neem keeps its `Concern: sleep नींद …` chunk. "Which plants help with sleep?" keeps retrieving Neem. Neem's DB record no longer supports sleep, so the LLM either drops it or the retrieval-only fallback quotes an unrelated Neem line as the association. The same applies to a moved location (old plant's `Campus:` text) and a moved VERIFIED reference.
- Suggested fix: In `adminCrud.PUT` and the references PUT, read the existing row's `plantId` before updating (`findUniqueOrThrow({ select: { plantId: true } })`). After the update, re-index both the old and new ids when they differ: `await Promise.all([...new Set([before.plantId, row.plantId])].map(indexPlant))`.
- **Status:** fixed (`lib/crud.ts`: PUT reads the row first when `reindex` is on and re-indexes both old and new `plantId`; `app/api/references/[id]/route.ts`: re-indexes `before.plantId` and `row.plantId`; docs updated in `ayurveda-references.md`, `campus-map.md`, `chatbot-rag.md`, `admin-dashboard.md`).

### CQ-4 [Medium] An embedding failure wipes previously good vectors (full reindex and single saves)
- Location: `lib/rag.ts:46-53`, `lib/rag.ts:73-74`, `lib/rag.ts:80-87`, `lib/ai.ts:43-58`
- Problem: `embed()` throws if any batch fails, and `embedDocs()` then returns `[]` for the whole call. `writeDocs()` deletes the old chunks and writes the new ones with `embedding: []`. A transient 429 or timeout therefore turns a working semantic index into a full-text-only index. Retrieval does not warn about it; it just stops scoring vectors.
- Scenario: The commit history shows free-tier quota problems. An admin presses "Rebuild knowledge base" with about 60 chunks. One `batchEmbedContents` call returns 429, and every plant is rewritten with empty embeddings. The button reports "Rebuilt N chunks from M plants" as a success. The evaluation's semantic cases (for example romanised `r02 "neend ke liye paudhe"`, which has no FTS hit) start failing until someone notices that "With embeddings" dropped to 0. A single plant save during a quota spike likewise strips that plant's vectors.
- Suggested fix: Make `embedDocs` report failure, for example by returning `null`. On failure in `indexPlant`, keep the old rows or carry forward existing vectors for unchanged `content`. In `reindexAll`, abort the rewrite (or rewrite only plants whose batch succeeded) and return `{ embedded: false }` so the route and button can show "Embeddings failed — existing vectors kept". Also check `data.embeddings.length === batch.length` in `embed()` so a short response cannot misalign vectors across plants in `reindexAll` (`vectors.slice(offset, …)`).
- **Status:** fixed (`lib/ai.ts`: `embed()` throws when the vector count differs from the batch; `lib/rag.ts`: `embedDocs` returns `null` on failure, `indexPlant`/`reindexAll` then carry forward stored vectors for chunks whose text is unchanged, `reindexAll` returns `embeddingsFailed`; `app/api/knowledge/reindex/route.ts` passes it through unchanged; `components/admin/SmallActions.tsx` `ReindexButton` reports the failure; `docs/features/chatbot-rag.md`). New or edited chunks still have no vector until the next successful reindex.

### CQ-5 [Medium] A REJECTED featured mantra is shown on the home page (labelled "pending")
- Location: `app/(public)/page.tsx:21`; `components/MantraAnimation.tsx:153` (the `MantraCard` source-status line)
- Problem: The home page uses `prisma.mantra.findFirst({ where: { featured: true } })` with no status filter. `/mantras` and `/api/mantras` both exclude REJECTED. `MantraCard` labels every non-VERIFIED mantra "(pending)".
- Scenario: An admin rejects the featured mantra's source after review but leaves "Show on home page" ticked. The home page keeps displaying it, and it now claims the rejected source is merely pending.
- Suggested fix: Add `verificationStatus: { not: "REJECTED" }` to the home-page query. Better, centralise a `PUBLIC_MANTRA_WHERE` constant (like `PUBLIC_REFERENCE_SELECT`) and use it in all three places.
- **Status:** fixed (`lib/public-select.ts` adds `PUBLIC_MANTRA_WHERE`, used in `app/(public)/page.tsx`, `app/(public)/mantras/page.tsx`, `app/api/mantras/route.ts`; `docs/features/mantras.md`).

### CQ-6 [Medium] A category cannot be saved without a map colour (422)
- Location: `app/admin/categories/page.tsx:22`, `components/admin/ResourceManager.tsx:61`, `lib/validation.ts:103`
- Problem: `ResourceManager` sends an empty input as `""`. `categorySchema.color` is `z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable()`, so `""` fails the regex. The field is optional in the UI (and the map falls back to `#4e7a3a`), but the API rejects it.
- Scenario: An admin adds the category "Medicinal climbers" and leaves the colour blank. Save fails with `color: Invalid`. Clearing the colour on an existing category to fall back to the default is also impossible.
- Suggested fix: Accept the blank value: `color: z.union([z.literal("").transform(() => null), z.string().regex(/^#[0-9a-fA-F]{6}$/)]).optional().nullable()`. This mirrors the `httpsUrl` pattern already in `lib/validation.ts`.
- **Status:** fixed (`lib/validation.ts`: `categorySchema.color` accepts `""` as null; `docs/features/plants-catalogue.md`).

### CQ-7 [Medium] Hindi function words become prefix search terms and flood retrieval and catalogue search
- Location: `lib/search.ts:4-8` (English-only `STOPWORDS`), `lib/search.ts:40`, `lib/search.ts:54`; used by `lib/rag.ts:124-142` and `findPlants`
- Problem: Stopwords are English only. In Hindi questions, particles such as `के`, `की`, `से`, `में`, `लिए`, `कौन`, `हैं` pass `w.length > 1` and become OR prefix terms (`के:* | से:* | …`). Nearly every Hindi line in the data contains them, for example `…पारंपरिक रूप से वर्णित।`.
- Scenario: Eval case `h01 "नींद के लिए कौन से पौधे हैं?"` produces 7 tokens. Five of them match the `traditionalUsesHi` part of most "use" chunks and the `descriptionHi` of most plants. The FTS step bumps up to 20 chunks by `0.5 + rank`, and `searchPlantIds` returns almost the whole catalogue, giving the top 5 another 0.8–0.4 bump. The top-5 handed to the LLM is dominated by plants with many Hindi lines rather than by sleep plants. In the catalogue, typing "नींद के लिए" returns nearly every plant.
- Suggested fix: Add a Hindi stopword list (`के का की को से में पर और या है हैं था लिए कौन क्या कैसे कोई वाले वाली पौधे पौधा बताइए`, etc.) to `STOPWORDS`. Optionally require 2+ graphemes for Devanagari tokens. Re-run the Hindi eval group afterwards.
- **Status:** fixed (`lib/search.ts`: Hindi function words and common romanised Hindi particles added to `STOPWORDS`; `docs/features/plants-catalogue.md`). The Hindi eval group has not been re-run yet; this needs a database and an AI key (Admin → Chatbot evaluation).

### CQ-8 [Medium] Coordinates pasted from Google Maps (as the page instructs) cannot be submitted
- Location: `app/admin/locations/page.tsx:30-31` (`step: "0.000001"`), `app/admin/locations/page.tsx:38-40` (help text)
- Problem: `<input type="number" step="0.000001">` triggers the browser's `stepMismatch` validation for any value with more than 6 decimals, and the form refuses to submit.
- Scenario: Following the on-page advice ("long-press your blue dot in Google Maps and copy the coordinates"), the admin pastes `29.9987654321`. Clicking Save shows "Please enter a valid value. The two nearest valid values are 29.998765 and 29.998766". The `LocateButton` path works only because it calls `toFixed(6)`.
- Suggested fix: Use `step: "any"`. If 6-decimal storage is desired, round on the server: `latitude: z.coerce.number().min(-90).max(90).transform((n) => Math.round(n * 1e6) / 1e6)`.
- **Status:** fixed (`app/admin/locations/page.tsx`: `step: "any"` on latitude/longitude; `docs/features/campus-map.md`). Server-side rounding was not added.

### CQ-9 [Medium] Users who prefer reduced motion get a hydration mismatch on mantra cards
- Location: `components/MantraAnimation.tsx:17-28` (`MantraText`), `components/MantraAnimation.tsx:74,85`, `components/MantraAnimation.tsx:119` (`FloatingLeaves`)
- Problem: framer-motion's `useReducedMotion()` returns `null` during SSR and the real `matchMedia` value on the first client render (`useState(prefersReducedMotion.current)`). `MantraText` renders a completely different tree when `reduce` is true (a plain `<p>` versus `<motion.p>` with per-grapheme spans), and `MantraCard` changes `initial`.
- Scenario: A visitor with "Reduce motion" enabled opens `/` or `/mantras`. React reports a hydration mismatch and client-renders the subtree, causing a flash and a console error. The accessibility setting is exactly what triggers the bug.
- Suggested fix: Render the same markup on the server and the client, then switch after mount (`const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), [])` and use `reduce && mounted`). Alternatively, wrap the app in `<MotionConfig reducedMotion="user">` and keep one tree, letting framer skip the animations. `MotionConfig` would also cover Chatbot, FloatingChat and NavbarClient, whose JS animations are not affected by the CSS `prefers-reduced-motion` rule in `app/globals.css:91`.
- **Status:** fixed (`components/MantraAnimation.tsx`: `useReducedMotionAfterMount()` returns false until mount, so SSR and first client render match; the MantraCard transition becomes `duration: 0` once reduced motion applies; `docs/features/mantras.md`). Not checked in a browser. The broader `MotionConfig reducedMotion="user"` suggestion for Chatbot/FloatingChat/NavbarClient was not applied.

### CQ-10 [Medium] In Hindi, all five catalogue filter selects share the same `id`
- Location: `components/PlantFilters.tsx:92`
- Problem: ``const id = `f-${label.replace(/\W+/g, "-")}` ``. `\W` matches every Devanagari character, so the Hindi labels "श्रेणी", "पारंपरिक उपयोग", "पौधे का प्रकार", "परिसर क्षेत्र" and "उपलब्धता" all produce `id="f--"`.
- Scenario: With the UI in Hindi, clicking the "उपलब्धता" label focuses the category select, and screen readers announce the wrong label for 4 of the 5 controls. The page also contains invalid duplicate IDs.
- Suggested fix: Pass a stable key (`"category" | "use" | "type" | "area" | "availability"`) to `FilterSelect` and use `id={\`f-${key}\`}`, or use React's `useId()`.
- **Status:** fixed (`components/PlantFilters.tsx`: `FilterSelect` uses `useId()`).

### CQ-11 [Low] Role select shows a role that was not saved after a rejected change
- Location: `components/admin/SmallActions.tsx:33-38`
- Problem: The select is uncontrolled (`defaultValue={role}`). When the PATCH fails, `router.refresh()` re-renders with the same `role` prop, but `defaultValue` is not re-applied to a mounted element.
- Scenario: An admin selects USER on their own row and gets the alert "You can’t remove your own admin role." The select keeps showing USER while the database still says ADMIN, until a full reload.
- Suggested fix: Use a controlled `value` with local state that is reset to `role` on failure, or remount with `key={role + version}` after an error.

### CQ-12 [Low] GPS capture: an error callback discards a good reading, and the watch outlives the form
- Location: `components/admin/LocateButton.tsx:58-66` (error handler), `components/admin/LocateButton.tsx:52-66` (no cleanup)
- Problem: (a) The error callback clears the watch and shows "Could not get a location" even when `best` already holds a usable reading. (b) There is no effect cleanup, so closing the form or navigating away leaves `watchPosition` and the 15 s timer running with high-accuracy GPS on.
- Scenario: (a) On a phone, the first fix arrives at ±14 m. Two seconds later the browser emits a transient `POSITION_UNAVAILABLE` or `TIMEOUT`, the ±14 m reading is thrown away, and the admin is told to retry outdoors. (b) The admin taps Cancel during the fix, and GPS stays active for up to 15 s.
- Suggested fix: In the error handler, call `finish()` when `best` is set and show the error only when there is no reading. Keep `watch` and `timer` in refs and clear them in a `useEffect` cleanup.

### CQ-13 [Low] Invalid catalogue query strings crash the plants page instead of falling back
- Location: `app/(public)/plants/page.tsx:19`
- Problem: `plantQuerySchema.parse(raw)` throws a ZodError inside a server component, which renders `app/error.tsx` ("This page didn’t load").
- Scenario: `/plants?page=0`, `/plants?pageSize=100` or `/plants?page=abc` (hand-edited or stale links) show the error page with a 500 instead of the first page.
- Suggested fix: Use `safeParse` and fall back to `plantQuerySchema.parse({})`, or use `.catch()` defaults on `page`/`pageSize`.

### CQ-14 [Low] Duplicate plant ids from the model produce duplicate answer cards
- Location: `lib/chat.ts:218-221`, `components/Chatbot.tsx:140`
- Problem: The model's `plants` array is filtered for unknown ids but not de-duplicated, and `AnswerView` keys cards by `p.id`.
- Scenario: The LLM returns `[{id:"tulsi…"}, {id:"tulsi…"}]`, for example once for cough and once for cold. The user sees Tulsi twice, React logs a duplicate-key warning, and one of the 4 slots is wasted.
- Suggested fix: De-duplicate while filtering: `const seen = new Set<string>(); …filter((p) => … && !seen.has(p.id) && seen.add(p.id))`.

### CQ-15 [Low] Chat and evaluation time budgets exceed `maxDuration`
- Location: `app/api/chat/route.ts:8` and `app/api/knowledge/evaluate/route.ts:5` (`maxDuration = 30`); `lib/ai.ts:56` (embed timeout 30 s); `lib/ai.ts:26` (LLM timeout 25 s)
- Problem: The worst case is query embedding (≤30 s) plus DB plus LLM (≤25 s), which is about 55 s against a 30 s function limit. The platform then kills the function with a 504 before the code's graceful retrieval-only fallback can run. The commit message for the new default model reports 5–17 s answers, which leaves little headroom.
- Scenario: The embedding call is slow (8 s) and the LLM takes 23 s. The user gets the generic "error" message instead of a retrieval-only answer. In the evaluation, the case shows up as `HTTP 504` and is counted as an error rather than as a fallback.
- Suggested fix: Use a shorter embed timeout for `RETRIEVAL_QUERY` (for example 5 s). Pass a deadline-derived `AbortSignal` into `generateJSON` so that embedding plus LLM stays under about 26 s. Raise `maxDuration` if the plan allows.

### CQ-16 [Low] Retrieval and indexing do avoidable sequential and full-table work
- Location: `lib/rag.ts:104-142` (vector, FTS and name search awaited one after another), `lib/rag.ts:108-111` (loads every embedding on every question), `lib/rag.ts:84-87` (one transaction per plant in `reindexAll`), `app/api/identify/route.ts:29-35` (loads every plant per identification), `app/(public)/plants/[slug]/page.tsx:100,111` (`getPlant` runs twice per request)
- Problem: The three retrieval signals are independent but run serially, which adds latency to every chat request. Vector search pulls `768 × chunks` floats per request. Reindexing issues N transactions.
- Scenario: Each chat request waits for the embed round trip, then the FTS query, then the name query. With 30 plants and about 300 chunks, every question transfers roughly 230k floats.
- Suggested fix: Run the three signals with `Promise.all` (embed + vector, FTS and `searchPlantIds` in parallel). Cache embeddings in module memory, invalidated by `indexPlant`/`reindexAll`, or move to pgvector when the catalogue grows. Write all plants in one `$transaction` in `reindexAll`. Wrap `getPlant` in React `cache()`. In identify, query only plants whose `scientificName`/`otherNames` match the candidate binomials.

### CQ-17 [Low] Photo identification: 4.5–5 MB photos and non-JSON errors show a raw parser error; English-only messages; preview URL leak
- Location: `components/PlantIdentifier.tsx:41-44`, `components/PlantIdentifier.tsx:56`
- Problem: The client allows up to 5 MB, but Vercel rejects bodies over about 4.5 MB with a non-JSON 413 response. `await res.json()` then throws a `SyntaxError`, and its message ("Unexpected token 'R'…") is shown to the user. The two client validation messages are hard-coded English. `URL.createObjectURL` is never revoked.
- Scenario: A 4.8 MB phone photo produces an unreadable JSON parse error instead of "photo too large", even in the Hindi UI.
- Suggested fix: Use `res.json().catch(() => ({}))` and map `413` to a dictionary string. Move both messages into `t.identify`. Revoke the previous preview URL in `choose()` and on unmount. Consider downscaling on the client to below 4 MB before upload.

### CQ-18 [Low] Hard-coded English UI strings and Hindi DB fields not shown through `pick()`
- Location: `app/(public)/map/page.tsx:196`; `app/(public)/page.tsx:81,131`; `app/(public)/mantras/page.tsx:274,282,287` (category names, empty state, aria-label); `app/error.tsx:6-8`; `app/not-found.tsx:9-12`; `components/AuthForms.tsx:51`; `components/PlantIdentifier.tsx:41-42`; `lib/map-data.ts:20` ("Other"); `lib/utils.ts:18-24` (`SOURCE_TYPE_LABEL` is English only and is shown on the public plant page and in chat answers); `app/(public)/ayurveda/page.tsx:238` (shows `concern`, ignoring `concernHi`); `app/api/identify/route.ts:31,51` (returns only English `traditionalUses`); `app/(public)/ayurveda/page.tsx:205,218,220-222,233` (inline `lang === "hi" ? …` strings instead of dictionary keys)
- Problem: These strings do not go through the `en`/`hi` dictionaries, and some Hindi DB fields are bypassed, which breaks the project's i18n convention.
- Scenario: With the UI in Hindi, `/mantras?category=Peace` with no results shows "No mantras in this category yet.", the reference block says "Classical Ayurvedic text", and the Ayurveda page lists "sleep" instead of "नींद".
- Suggested fix: Add the strings to both dictionaries and switch `SOURCE_TYPE_LABEL` to `{en, hi}` like `PLANT_TYPE_LABEL`. Use `pick(lang, c.concern, c.concernHi)` and return `traditionalUsesHi` from identify for `pick`-style selection.

### CQ-19 [Low] Client mutations leave the UI stuck "busy" on network failure
- Location: `components/admin/ResourceManager.tsx:64-69` and `81`; `components/admin/FileUploadField.tsx:20-22`; `components/FeedbackForm.tsx:19-23`; `components/AuthForms.tsx:22-24` and `48-50`; `components/admin/SmallActions.tsx` (`ReindexButton`, `ResolveToggle`)
- Problem: `await fetch(...)` is not wrapped in `try/finally`. A rejected fetch (offline, or connection reset on a long reindex) skips `setBusy(false)` and causes an unhandled promise rejection. `ResolveToggle` also ignores non-OK responses.
- Scenario: On the campus Wi-Fi the connection drops while saving a location from the phone. The Save button stays "Saving…" and disabled until reload, and the feedback form stays on "sending" forever.
- Suggested fix: Wrap each call in `try { … } catch { setError(...) } finally { setBusy(false) }`, matching the pattern already used in `Chatbot.tsx` and `PlantIdentifier.tsx`.

### CQ-20 [Low] Evaluation scoring: the "unsafe" check also fails on database text, and the fallback count is mislabelled
- Location: `lib/eval.ts:139`, `components/admin/EvaluationRunner.tsx:86,171-172`
- Problem: (a) `safe` applies `UNSAFE_MODEL_TEXT` to every `association`, including lines taken verbatim from the DB (the retrieval-only fallback and `groundAssociation` replacements), even though `lib/chat.ts:54` says "Record text itself is never filtered". (b) `llmFallbacks` counts every answer with `llmUsed === false` and plants returned. That includes the case where the AI call succeeded but every model id was dropped, yet the UI says the fallback happened "because the AI call failed (often a rate limit)".
- Scenario: (a) An admin adds a record line such as "Traditionally taken twice a day as kadha" or mentions "Charaka Samhita" in a use. Every question retrieving that plant then fails with "Answer text contains dose…", although the model wrote nothing. (b) A model that only returns invented ids is reported as rate limiting.
- Suggested fix: Have `answerQuestion` return which associations are model text (for example `source: "model" | "record"` per plant) and score only model text, plus `context` when it came from the model. Report "model selection unusable" separately from "AI call failed" (for example `llmUsed: "ok" | "error" | "empty"`).

### CQ-21 [Low] Synonym expansion misses common forms
- Location: `lib/search.ts:11-14` (`stem`), `lib/search.ts:17-32` (`SYNONYMS`)
- Problem: `stem("digestion")` returns `digestion`, which does not match the `digest` key, so "digestion" never expands to `agni`/`पाचन`. `SYNONYMS.cough` contains `खांसी` (anusvara), but the seed data uses `खाँसी` (chandrabindu), so the English→Hindi expansion never matches the data.
- Scenario: "Plants for better digestion" in Hindi mode gets no Devanagari expansion. "cough" never hits the Hindi `concernHi` text.
- Suggested fix: Add `digestion`, `digestive` and `immune` keys (or stem `-ion`/`-ive`). Include both spellings (`खांसी`, `खाँसी`), or normalise chandrabindu to anusvara in `tokenize` and in the indexed text.

### CQ-22 [Low] Map: "first category" is nondeterministic, and the focused view resets on filter
- Location: `lib/map-data.ts:7` (`categories: { take: 1 }` with no `orderBy`), `components/PlantMap.tsx:49-53`
- Problem: (a) The implicit many-to-many join has no defined order, so marker colour and legend group can change between requests or after edits. (b) `FitTo` depends on `visible`, a new array on every render, and on `focus`. With `?plant=` set, every legend click re-centres on the focused plant at zoom 18, even when that plant is filtered out.
- Scenario: (b) On `/map?plant=neem`, clicking "Sacred" in the legend snaps back to Neem instead of fitting the sacred plants.
- Suggested fix: Use `categories: { take: 1, orderBy: { slug: "asc" } }` or an explicit primary category. Apply focus only on first mount (a ref flag) and fit `visible` when the category filter changes.

### CQ-23 [Low] `slugify` produces an empty slug for non-Latin common names
- Location: `lib/utils.ts:8-16`, `app/api/plants/route.ts:18-19`
- Problem: Every non-`[a-z0-9]` character is stripped, so a Devanagari `commonName` yields `""`.
- Scenario: An admin creates a plant with common name "गिलोय". The plant is saved with `slug = ""`, and its card links to `/plants/`, which is the catalogue rather than the plant. The next such plant gets `-lq3x…`.
- Suggested fix: Fall back to `slugify(scientificName)` when the result is empty, and use `cuid` as a last resort.

### CQ-24 [Low] A benefit can link to another plant's reference
- Location: `lib/validation.ts:75-82`, `app/api/benefits/route.ts:10`
- Problem: Only the FK existence of `referenceId` is checked. Nothing ensures `reference.plantId === benefit.plantId`.
- Scenario: In the benefit form, the admin picks plant "Amla" but selects "Tulsi — …" in the reference dropdown (the option list mixes all plants). The print sheet then lists an Amla association under a Tulsi reference.
- Suggested fix: Filter the options by the selected plant in the UI, and on the server reject (422) a `referenceId` whose `plantId` differs.

### CQ-25 [Low] Login redirect drops the query string; `?registered=1` is never read
- Location: `middleware.ts:49`, `components/AuthForms.tsx:52`
- Problem: `callbackUrl` is set to `pathname` only. The register flow pushes `/login?registered=1`, but nothing displays a confirmation.
- Scenario: An expired session on `/admin/references/print?status=all` sends the admin back to the pending-only sheet after login. A newly registered user lands on the login page with no "account created" message.
- Suggested fix: Use `pathname + req.nextUrl.search`, which `safeRedirectPath` already supports. Show a `t.auth.registered` notice (in both dictionaries) when the param is present, or drop the param.

### CQ-26 [Low] Closing or navigating away from the floating chat discards the conversation
- Location: `components/FloatingChat.tsx:14,42`
- Problem: `<Chatbot compact />` is unmounted whenever the panel closes, including on every route change (`useEffect(() => setOpen(false), [pathname])`), so messages and `conversationId` are lost.
- Scenario: A user asks about Tulsi, clicks the plant link in the answer (a route change), reopens the chat, and the thread is gone. A signed-in user also starts a new `ChatConversation` row each time.
- Suggested fix: Keep `Chatbot` mounted and hide it with CSS or `AnimatePresence` on a wrapper, or lift the messages and `conversationId` state into `FloatingChat` or a context.

### CQ-27 [Low] Duplicated constants and logic that will drift
- Location: `lib/ai.ts:17` and `app/admin/settings/page.tsx:8` (default model `"gemini-3.1-flash-lite"` duplicated); `lib/validation.ts:93`, `app/admin/mantras/page.tsx:4`, `app/(public)/mantras/page.tsx:258` (mantra categories ×3); `lib/search.ts:92-93` versus the Prisma enums; `prisma/seed.ts` (re-implements `buildDocs` from `lib/rag.ts:17-44` and already differs: no `ayurvedicProperties` in the plant chunk); `components/admin/PlantForm.tsx:26` / `components/PlantIdentifier.tsx:26` (5 MB limit duplicated from `MAX_IMAGE_BYTES`)
- Problem: Several values and pieces of logic exist in more than one place.
- Scenario: The last commit had to change the model id because the old one returned 404s, which silently forced retrieval-only mode. If someone changes only `lib/ai.ts`, the Settings page reports the wrong model. Seeded chunks differ from reindexed chunks, so evaluation results change after the first Reindex.
- Suggested fix: Export `DEFAULT_CHAT_MODEL`, `MANTRA_CATEGORIES` and `MAX_IMAGE_BYTES` from a shared non-`server-only` module. Use `Object.values(PlantType)` from `@prisma/client`. Have the seed call a shared `buildDocs` (move it to a module without `server-only`) or simply tell the user to run Reindex.

### CQ-28 [Low] `as never` casts on every `adminCrud` delegate and on the chat payload hide type errors
- Location: `app/api/{locations,benefits,mantras,categories}/route.ts` and `[id]/route.ts` (`prisma.x as never`), `lib/crud.ts:34`, `app/api/chat/route.ts:33`
- Problem: The casts disable the check that each zod schema's output matches the model's create/update input. CQ-6 is the kind of mismatch they would otherwise surface earlier. Audit entries for POST/DELETE record no details, so a deleted location's plant cannot be identified from the log.
- Scenario: Renaming a Prisma column (for example `campusArea`) still typechecks and fails only at runtime with a 500.
- Suggested fix: Type `Delegate` generically, for example `adminCrud<S, D extends { create(a: { data: z.infer<S> }): Promise<…> }>`, or pass small typed adapter functions. In `adminCrud`, log `{ plantId: row.plantId }` for CREATE/DELETE.

## Docs out of sync
- `docs/features/plants-catalogue.md:25`: says creating or updating a plant calls `indexPlant()` "in the background (not awaited)". The code awaits it (`app/api/plants/route.ts:25`, `app/api/plants/[id]/route.ts:36`), and `chatbot-rag.md` correctly says it is awaited.
- `CLAUDE.md:17`: says "no migrations committed yet; first run: npx prisma migrate dev --name init", but `prisma/migrations/20260925101144_init/` is committed.
- `docs/features/ayurveda-references.md` ("Every create, update or delete re-indexes the plant") and `docs/features/chatbot-rag.md` ("Any change … must re-index that plant"): not true when a record is moved between plants (CQ-3).
- `docs/features/mantras.md` ("Public lists exclude REJECTED mantras"): the home-page featured mantra does not (CQ-5).
- `docs/features/campus-map.md`: LocateButton also stops early once a reading is ≤10 m, and it re-ticks `isApproximate` when accuracy is worse than 20 m (overriding a manual untick). The doc mentions only the 15 s watch and the unticking.
- `docs/features/chatbot-rag.md` (Evaluation, "Every case also fails if the answer text matches UNSAFE_MODEL_TEXT"): only `context` and associations are checked, and associations include DB text (CQ-20).
- `docs/features/security.md` / `CLAUDE.md` ("Verify changes with … `npm run lint`"): lint does not run, because no ESLint config exists (see header).
