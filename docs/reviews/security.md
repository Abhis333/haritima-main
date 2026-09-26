# Security audit — 2026-09-25

Scope: Defensive, read-only review of every server entry point: all `app/api/**/route.ts` handlers, the two server actions, `middleware.ts`, and the Auth.js setup (`lib/auth.ts`, `lib/auth.config.ts`, `lib/guards.ts`, `types/next-auth.d.ts`). I also followed the calls into `lib/validation.ts`, `lib/crud.ts`, `lib/audit.ts`, `lib/rate-limit.ts`, `lib/cloudinary.ts`, `lib/plantnet.ts`, `lib/search.ts`, `lib/rag.ts`, `lib/chat.ts`, `lib/ai.ts`, `next.config.ts`, `prisma/schema.prisma`, `app/admin/layout.tsx`, `scripts/create-admin.ts`, and the client components that render user-controlled or LLM data (`Chatbot.tsx`, `PlantMap.tsx`, `MantraAnimation.tsx`, `app/(public)/plants/[slug]/page.tsx`). I checked everything against `CLAUDE.md` and `docs/features/security.md`.

I could not run `npm audit --omit=dev` because `node_modules` is not installed. I did not read `.env`. I made no network calls.

**Summary:** Critical 0 · High 0 · Medium 5 · Low 10 · Info 6 (21 findings)

**Fix pass (2026-09-25, code-improver):** SEC-1–8, 11–15, 17 and 19 were handled; see each finding's **Status** line. SEC-9, 10, 16, 18, 20 and 21 were deferred by request and left untouched. `npm run typecheck` passes. `npm run lint` can't run: the repo has no ESLint config or `eslint` dependency, so `next lint` stops at its interactive setup prompt.

Entry points reviewed: 23 route files (41 handlers), plus 2 server actions and the middleware.

| Route | Methods | Auth |
|---|---|---|
| `app/api/auth/[...nextauth]/route.ts` | GET, POST | Auth.js (CSRF token) |
| `app/api/plants/route.ts` | GET, POST | GET public; POST `requireAdmin` |
| `app/api/plants/[id]/route.ts` | GET, PUT, DELETE | GET public; PUT/DELETE `requireAdmin` |
| `app/api/categories/route.ts` | GET, POST | GET public; POST `adminCrud` |
| `app/api/categories/[id]/route.ts` | PUT, DELETE | `adminCrud` |
| `app/api/locations/route.ts` | GET, POST | GET public; POST `adminCrud` |
| `app/api/locations/[id]/route.ts` | PUT, DELETE | `adminCrud` |
| `app/api/benefits/route.ts` | GET, POST | GET public; POST `adminCrud` |
| `app/api/benefits/[id]/route.ts` | PUT, DELETE | `adminCrud` |
| `app/api/mantras/route.ts` | GET, POST | GET public; POST `adminCrud` |
| `app/api/mantras/[id]/route.ts` | PUT, DELETE | `adminCrud` |
| `app/api/references/route.ts` | GET, POST | GET public (`?all=1` admin only); POST `requireAdmin` |
| `app/api/references/[id]/route.ts` | PUT, DELETE | `requireAdmin` |
| `app/api/feedback/route.ts` | GET, POST | GET `requireAdmin`; POST public + rate limit |
| `app/api/feedback/[id]/route.ts` | PATCH, DELETE | `requireAdmin` |
| `app/api/users/route.ts` | GET | `requireAdmin` |
| `app/api/users/[id]/route.ts` | PATCH | `requireAdmin` |
| `app/api/upload/route.ts` | POST | `requireAdmin` |
| `app/api/knowledge/reindex/route.ts` | POST | `requireAdmin` |
| `app/api/chat/route.ts` | POST | public + rate limit; history owner-scoped |
| `app/api/identify/route.ts` | POST | public + rate limit |
| `app/api/register/route.ts` | POST | public + rate limit |
| `app/api/stats/route.ts` | GET | public |
| Server action `login` in `app/(public)/login/page.tsx:13` | — | public (Auth.js `signIn`) |
| Server action `logout` in `components/Navbar.tsx:6` | — | session |
| `middleware.ts` (matcher `/admin/:path*`, `/api/:path*`) | — | Origin check + admin redirect |

Every mutating API handler calls `requireAdmin()` itself, except for the intentionally public `chat`, `identify`, `feedback` POST and `register`. I found no mutating route that relies on middleware alone.

## Findings

### SEC-1 [Medium] Public reference APIs expose admin email addresses and internal notes
- Location: `app/api/references/route.ts:14-18`, `app/api/plants/[id]/route.ts:11-19`, with the fields written at `app/api/references/route.ts:27` and `app/api/references/[id]/route.ts:19`
- Class: Information disclosure / excessive data exposure
- Impact: When an admin verifies a reference, `verifiedBy` stores `admin.email`. Both public GET endpoints return whole `AyurvedicReference` rows with no `select`, so any anonymous visitor can collect the login email of every verifying admin. The admin-only `notes` field is exposed too, and `/api/plants/[id]` also returns the full citation text of PENDING references. Combined with SEC-3, an attacker knows exactly which accounts to password-guess.
- Evidence: `prisma.ayurvedicReference.findMany({ where, include: { plant: … } })` and `include: { references: { where: { verificationStatus: { not: "REJECTED" } } } }` return every scalar column (`verifiedBy`, `notes`, `verifiedAt`, …). `schema.prisma:136-138`.
- Fix: Add an explicit public `select`, for example `{ id, plantId, textName, author, chapter, section, verse, citation, referenceUrl, sourceType, verificationStatus }`, to both public GETs. Return `verifiedBy` and `notes` only when `all=1` and the caller is an admin. Consider storing the admin's user id, not their email, in `verifiedBy`.
- **Status:** fixed (`lib/public-select.ts` new, `app/api/references/route.ts`, `app/api/plants/[id]/route.ts`). Public GETs use an explicit field list; `verifiedBy`, `verifiedAt` and `notes` are returned only for admin `?all=1`. `verifiedBy` still stores the admin email; that is now admin-only and shown in the admin UI's "Verified by" column.

### SEC-2 [Medium] Role changes and account removal do not revoke existing sessions for up to 7 days
- Location: `lib/auth.config.ts:6` (maxAge 7 days), `lib/auth.config.ts:9-15` (jwt callback), `lib/guards.ts:10-14`
- Class: Broken access control (stale authorization)
- Impact: `role` is copied into the JWT only at sign-in (`if (user)`). `requireAdmin()` trusts `session.user.role` from the token and never re-reads the database. A demoted or compromised admin keeps full admin API access, including user role changes, until the token expires. The only way to cut it short is to rotate `AUTH_SECRET`, which logs everyone out. A deleted user's token also stays valid.
- Evidence: `jwt({ token, user }) { if (user) { … token.role = … } return token; }`. `requireAdmin` does `session.user.role !== "ADMIN"` with no database lookup.
- Fix: In `requireAdmin()` (Node runtime), load `prisma.user.findUnique({ where: { id }, select: { role: true } })` and authorize on the database role. Alternatively, add a `tokenVersion`/`roleChangedAt` column that the users PATCH bumps and the jwt callback checks. Also shorten `maxAge` (e.g. 1 day) with `updateAge`.
- **Status:** fixed (`lib/guards.ts`, `app/admin/layout.tsx`, `lib/auth.config.ts`). `requireAdmin()` and the admin layout re-read the role from the database, and a missing user gets 401. Sessions are now `maxAge` 1 day with `updateAge` 1 hour. No `tokenVersion` column was added (no schema change). Middleware's `/admin` redirect still uses the JWT role, but the layout re-check blocks a demoted admin.

### SEC-3 [Medium] No throttling or lockout on credential sign-in
- Location: `lib/auth.ts:18-26` (authorize), `app/(public)/login/page.tsx:13-23` (server action), `app/api/auth/[...nextauth]/route.ts:2`
- Class: Broken authentication (online brute force) / DoS
- Impact: `rateLimit()` covers register, chat, identify and feedback, but not login. An attacker can keep guessing passwords for a known admin email (see SEC-1). Each attempt also costs a bcrypt-12 compare (about 200–300 ms of CPU), so a login flood is a cheap way to exhaust CPU. Users need only 8-character passwords (`lib/validation.ts:123`).
- Evidence: `authorize()` goes straight from `credentialsSchema.safeParse` to `prisma.user.findUnique` and `bcrypt.compare`, with no limiter.
- Fix: Inside `authorize()`, call `rateLimit()` keyed on both the normalised email (e.g. 5 per 15 min) and the client IP. Better still, use a shared store (Upstash) so limits hold across instances. Consider a longer minimum length for admin accounts.
- **Status:** fixed (`lib/auth.ts`). `authorize()` limits to 5 attempts per email and 20 per client address per 15 minutes, before any DB/bcrypt work. It stays in memory per instance; the shared store is deferred (see SEC-5). Admin minimum password length is unchanged.

### SEC-4 [Medium] LLM free-text fields are not held to the "no citations / no doses" invariant
- Location: `lib/chat.ts:111-118`, `lib/chat.ts:146-156`, rendered in `components/Chatbot.tsx` (`answer.context`, `p.association`)
- Class: LLM output integrity / prompt injection
- Impact: The server attaches references only from the database, and it correctly drops invented ids. However, `context` (up to 600 chars) and each `association` (up to 500 chars) are model-written text shown verbatim. Only the system prompt keeps them honest. A question containing injected instructions, or an ordinary hallucination, can make the model write book names, chapter/verse citations, doses or diagnostic statements. These then appear beside a green "Verified" reference badge, which breaks the documented invariants "the model never writes citations" and "no diagnosis/doses". React escapes the output, so this is a content-integrity issue, not XSS. The injected answer is shown only to the person who asked, but benign users can hit the hallucination case too.
- Evidence: `selection = out.plants.filter((p) => byId.has(p.id))` checks only the id. `association` is not compared against the record, and `context` is only truncated.
- Fix: Use the database text as the displayed association, e.g. make the model return an index into the record's `traditionalUses`/`benefits` lines. At minimum, reject or replace model text that doesn't overlap the source line. Add a server-side filter that blanks `context`/`association` when they match dosage patterns (`\d+\s*(mg|g|ml|tsp|times)`), diagnosis wording, or known text names (Charaka, Sushruta, Bhavaprakasha, …). Keep the question inside a clearly delimited JSON field (as now) and tell the model to treat it as data.
- **Status:** fixed (`lib/chat.ts`, `components/Chatbot.tsx`). Model `association` is shown only if it has no dose, diagnosis/cure or classical-text/citation wording and has at least 50% word overlap with a DB benefit or use line. Otherwise the closest DB line is shown. An unsafe model `context` is replaced by fixed text. The prompt now says to treat the question as untrusted data. The pattern list is heuristic and may not catch every phrasing.

### SEC-5 [Medium] Per-instance, spoofable rate limiter guards costly public endpoints
- Location: `lib/rate-limit.ts:14` (clear-all), `lib/rate-limit.ts:19` (`clientKey`), used in `app/api/chat/route.ts:12-14`, `app/api/identify/route.ts:12`, `app/api/feedback/route.ts:8`, `app/api/register/route.ts:8`
- Class: Rate-limit bypass / cost amplification (DoS)
- Impact: (a) `clientKey` trusts the first `x-forwarded-for` entry. On Vercel the platform overwrites this header, but on any other host (or a proxy that appends) a client can send a new value on every request and never be limited. (b) Once the map passes 5,000 keys, `hits.clear()` resets every counter. An attacker cycling through addresses (cheap with IPv6) resets everyone's limits, including the register limit. (c) Clients with no IP header share one `"anon"` bucket, so one abuser can lock out all of them. (d) Counts are per serverless instance. Each chat question costs one Gemini embedding plus one generation call, and each identify request costs one Pl@ntNet call, so bypassing the limiter burns paid or free-tier quotas and can disable both features.
- Evidence: `req.headers.get("x-forwarded-for")?.split(",")[0].trim()`, `if (hits.size > 5000) hits.clear();`
- Fix: Move to a shared limiter (Upstash `@upstash/ratelimit`), as the README already suggests. Take the client IP from the platform (`request.ip` / `x-vercel-forwarded-for` or `x-real-ip` on Vercel) or from a configured trusted-proxy hop, not the leftmost XFF. Evict only expired entries (or use an LRU) instead of clearing everything. Group IPv6 addresses by /64. Add a global daily cap on AI/Pl@ntNet calls.
- **Status:** fixed, in-code part only (`lib/rate-limit.ts`). The IP comes from `x-vercel-forwarded-for` → `x-real-ip` → right-most XFF hop (never the left-most). IPv6 is grouped by /64 and IPv4-mapped IPv6 is unwrapped. Overflow evicts expired and then least-recently-used keys instead of `clear()`. Not done (deferred, needs infra): shared Upstash store and a global daily AI/Pl@ntNet cap. The `"anon"` bucket remains for requests with no IP header.

### SEC-6 [Low] CSRF Origin check allows a missing Origin, errors on `Origin: null`, and prefers `x-forwarded-host`
- Location: `middleware.ts:12-18`
- Class: CSRF (defence in depth)
- Impact: Requests with no `Origin` header are allowed. Modern browsers send `Origin` on cross-site POST, and Auth.js's default `SameSite=Lax` session cookie is the main protection, so there is no exploitable CSRF today. The gaps: (1) older clients, or extensions that strip `Origin`, bypass the check. (2) `Origin: null` (sandboxed iframes, some cross-origin redirects) makes `new URL("null")` throw inside middleware, which returns an unhandled 500 rather than a clean 403. (3) `x-forwarded-host` is trusted over `host`. A browser cannot set it cross-site without a failing CORS preflight, so this matters only off-Vercel behind a proxy that passes client values through. The handlers also `req.json()` any content type, so `text/plain` form posts get parsed as JSON.
- Evidence: `if (origin && host && new URL(origin).host !== host)`
- Fix: Wrap the `URL` parse in try/catch and reject on failure. For non-GET API calls, require either a same-origin `Origin` or (when it's absent) `Sec-Fetch-Site: same-origin`. Compare against a configured `NEXT_PUBLIC_SITE_URL` host rather than forwarded headers. Require `Content-Type: application/json` (or `multipart/form-data` for upload/identify) on mutating routes.
- **Status:** fixed (`middleware.ts`). A malformed `Origin` (e.g. `null`) now returns 403 instead of throwing. When `Origin` is missing, `Sec-Fetch-Site` must be `same-origin`/`none` (or absent, for non-browser clients). Allowed hosts are `Host`, `X-Forwarded-Host` and the `NEXT_PUBLIC_SITE_URL` host. `X-Forwarded-Host` is still accepted so proxied self-hosted setups keep working. Not done: requiring `Content-Type: application/json` on mutating routes (cross-site `text/plain` posts are already blocked by the Origin/Sec-Fetch-Site check).

### SEC-7 [Low] Account enumeration through registration and login timing
- Location: `app/api/register/route.ts:10`, `lib/auth.ts:21-22`
- Class: Information disclosure (user enumeration)
- Impact: Registration returns a distinct 409 "An account with this email already exists." (limited to 5 per hour per IP, but see SEC-5). Login returns early without a bcrypt compare when the email is unknown, so unknown emails answer about 250 ms faster than known ones.
- Evidence: `if (await prisma.user.findUnique({ where: { email } })) throw new HttpError(409, …)`; `if (!user) return null;` before `bcrypt.compare`.
- Fix: In `authorize`, always compare against a constant dummy hash when the user is missing. For register, either accept the privacy trade-off (common for simple sign-up) or return a generic response. P2002 already covers the race.
- **Status:** partly fixed (`lib/auth.ts`). Login always runs a bcrypt compare, against a lazily created dummy hash when the email is unknown. Register still returns 409 for an existing email: needs approval, because a generic response changes the sign-up UX (the user isn't told they already have an account).

### SEC-8 [Low] Last-admin guard is a non-atomic check-then-write
- Location: `app/api/users/[id]/route.ts:13-17`
- Class: Race condition (TOCTOU) in authorization logic
- Impact: Two admins who demote each other at the same moment both see `count = 2`, and both updates succeed, leaving zero admins. Recovery then needs shell access (`npm run create-admin`). The check also runs `count` even when the target is already a USER. That's harmless, but it means a USER→USER PATCH fails when there is only one admin.
- Evidence: `const admins = await prisma.user.count(...); if (admins <= 1) throw …; await prisma.user.update(...)`
- Fix: Run the count and update in one `prisma.$transaction` at `Serializable` isolation, or use a conditional update (`updateMany({ where: { id, role: "ADMIN" } })`) followed by a recount that rolls back if the count is 0. Skip the check when the target is not currently an ADMIN.
- **Status:** fixed (`app/api/users/[id]/route.ts`). The count and update run in one `prisma.$transaction` that locks all ADMIN rows with `SELECT … FOR UPDATE`. The last-admin check runs only when the target is currently an admin.

### SEC-9 [Low] No Content-Security-Policy or HSTS header
- Location: `next.config.ts:3-8`
- Class: Security misconfiguration (missing defence in depth)
- Impact: No XSS sink is present today (`dangerouslySetInnerHTML` is used only for JSON-LD, with `<` escaped, at `app/(public)/plants/[slug]/page.tsx:64`; Leaflet `divIcon` HTML uses only numbers and a hex colour validated by `categorySchema`). Still, any future injection would run without a CSP backstop. HSTS is left to the platform.
- Fix: Add a nonce-based CSP, set in middleware so the nonce reaches Next's inline scripts. It would need roughly: `default-src 'self'; script-src 'self' 'nonce-…' 'strict-dynamic'; style-src 'self' 'unsafe-inline'` (Leaflet and framer-motion set inline styles); `img-src 'self' data: blob: https://res.cloudinary.com https://upload.wikimedia.org https://*.tile.openstreetmap.org` (plus the `NEXT_PUBLIC_MAP_URL` host); `media-src https://res.cloudinary.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`. Add `Strict-Transport-Security: max-age=63072000; includeSubDomains` if the custom domain doesn't already get it.

### SEC-10 [Low] Chat does unbounded work per question and can exceed its time limit
- Location: `lib/rag.ts:83-91`, `app/api/chat/route.ts:8`, `lib/ai.ts:26`, `lib/ai.ts:56`
- Class: DoS / resource exhaustion
- Impact: Every question loads every `KnowledgeDocument` embedding (768 floats per chunk) into memory and scores it in JS. That's fine at seed size, but it grows linearly with content and is triggered by anonymous users (see SEC-5). The question embedding (30 s timeout) and the generation call (25 s timeout) run one after the other inside a 30 s `maxDuration`, so a slow upstream means a killed function and a 504 rather than the retrieval-only fallback.
- Evidence: `prisma.knowledgeDocument.findMany({ where: { NOT: { embedding: { isEmpty: true } } }, select: { plantId: true, embedding: true } })`
- Fix: Move to pgvector with an index (or at least cache embeddings in memory per instance, keyed by `updatedAt`). Give the whole chat request one time budget, e.g. embedding 5 s and generation 15 s, via a shared `AbortController`, and fall back to FTS-only when it runs out.

### SEC-11 [Low] Re-indexing is not atomic and runs fire-and-forget, so plants can silently vanish from the chatbot
- Location: `lib/rag.ts:17-55`, `app/api/plants/route.ts:24`, `app/api/plants/[id]/route.ts:33`, `lib/rag.ts:59-64` with `app/api/knowledge/reindex/route.ts:5`
- Class: Integrity / availability
- Impact: `indexPlant` deletes a plant's chunks, then calls the embedding API, then inserts. The plant POST/PUT handlers start it without `await`, and on Vercel a promise still pending after the response is sent may be frozen or killed. If that happens between the delete and the insert, the plant drops out of RAG retrieval with no error. `reindexAll` embeds plant by plant within a 60 s limit, so a large catalogue times out partway and leaves the last plant half-done.
- Evidence: `indexPlant(id).catch(console.error);` (not awaited); `deleteMany` runs before `embed` and `createMany`.
- Fix: Compute the embeddings first, then run `deleteMany` and `createMany` inside one `prisma.$transaction`. `await` the call in the plant routes, or use `after()` from `next/server`, which keeps the function alive. Batch `reindexAll` (one `embed` call for all chunks, or paginate with a cursor the admin UI calls repeatedly).
- **Status:** fixed (`lib/rag.ts`, `app/api/plants/route.ts`, `app/api/plants/[id]/route.ts`). Embeddings are computed first, then delete + insert run in one transaction. Plant POST/PUT now `await` the re-index. `reindexAll` embeds all chunks in batches of 90 instead of one call per plant. It is still one request, so a very large catalogue could still hit the 60 s limit, but a timeout no longer leaves a plant half-indexed.

### SEC-12 [Low] Audio uploads are validated only by the client-supplied MIME type
- Location: `app/api/upload/route.ts:16-18`
- Class: Unrestricted file upload (admin-only)
- Impact: `file.type` comes from the client. Any file under 10 MB labelled `audio/mpeg` gets sent to Cloudinary's `video` resource type, which also accepts video files. This route requires an admin, so the risk is limited to storage abuse by a compromised admin account. Also, `req.formData()` buffers the whole body before any size check (see SEC-13).
- Fix: Sniff audio magic bytes: `ID3` or frame sync `0xFF 0xE*` (MP3), `OggS`, `RIFF…WAVE`, `1A 45 DF A3` (WebM). After upload, check that Cloudinary's reported `resource_type`/`format` is audio. Send `allowed_formats` as a signed parameter.
- **Status:** partly fixed (`lib/cloudinary.ts` `sniffAudio`, `app/api/upload/route.ts`). Audio must pass a magic-byte check (ID3/MPEG sync, OggS, RIFF…WAVE, EBML) as well as the MIME allow-list. Not done: a signed `allowed_formats` parameter and a post-upload `resource_type` check. These change the Cloudinary signature and can't be verified without a Cloudinary account.

### SEC-13 [Low] Public `/api/identify` buffers the whole multipart body before the size check
- Location: `app/api/identify/route.ts:15-20` (also `app/api/upload/route.ts:8`)
- Class: DoS (memory)
- Impact: `await req.formData()` parses and buffers the full request before `image.size > MAX_IMAGE_BYTES` is checked. On Vercel, the platform's 4.5 MB request-body cap limits this. That same cap means the documented 5 MB image and 10 MB audio limits can never actually be reached. If self-hosted, a few large anonymous requests (8 per minute per spoofable key, SEC-5) can exhaust memory. *Needs confirmation for non-Vercel deployments.*
- Fix: Reject early on `Content-Length` greater than the limit plus multipart overhead. Before calling `formData()`, stream the body with a byte counter. Align the documented limits with the platform cap, or use direct signed browser-to-Cloudinary uploads for larger media.
- **Status:** fixed (`lib/body.ts` new, `app/api/identify/route.ts`, `app/api/upload/route.ts`). `readFormData()` rejects an oversized `Content-Length` and streams the body with a byte counter (limit plus 64 KB overhead) before parsing. Upload caps at the audio limit, because the kind is only known after parsing. The documented 5/10 MB limits vs Vercel's 4.5 MB body cap are unchanged (documented in `docs/features/uploads-media.md`).

### SEC-14 [Low] Urgent-symptom detection is narrow, and urgent answers still suggest plants
- Location: `lib/chat.ts:23-24`, `lib/chat.ts:77-81`
- Class: LLM / health-safety control gap
- Impact: The regex misses common wordings: "cannot breathe", "can not breathe", "short of breath", "fainted", "bleeding a lot", "want to die", many Hindi spellings and romanised Hindi. Even when it does match, the answer still lists herbal associations next to the warning, which can read as a remedy for an emergency.
- Fix: Broaden the pattern list and add romanised Hindi. When `urgent` is set, return only the urgent message and the disclaimer, with no plant suggestions. Optionally ask the LLM for an `urgent` flag and OR it with the regex; never let it clear the regex result.
- **Status:** fixed (`lib/chat.ts`, `app/api/chat/route.ts`, `components/Chatbot.tsx`). The pattern list now covers more English wording plus Devanagari and romanised Hindi. On a match, the answer is only the urgent message and the disclaimer: no retrieval, LLM call or plants. "poison"/"जहर" match only with ingestion wording, so "which plants are poisonous?" still gets an answer. The optional LLM `urgent` flag is not added.

### SEC-15 [Low] A `to_tsquery` failure becomes an unhandled 500 in chat — *Needs confirmation*
- Location: `lib/search.ts:34-54`, `lib/rag.ts:99-107`, `lib/search.ts:59-76`
- Class: Input handling / error robustness (not injection)
- Impact: Values reach SQL only as bound `Prisma.sql` parameters, and `tokenize()` leaves only `\p{L}\p{M}\p{N}` characters, so I found no injection path. Tokens made only of combining marks, or numerals the PostgreSQL parser treats as separators, normally become stop-word placeholders rather than errors. I could not prove every Unicode input is safe without a database. If one does throw, the FTS query in `retrievePlantIds` (line 101) is not wrapped in try/catch, unlike `searchPlantIds` at line 109, so the whole chat request returns 500. The same holds for `/api/plants?q=`.
- Fix: Build the query with `websearch_to_tsquery`/`plainto_tsquery` over the tokens, or keep only tokens that contain at least one `\p{L}` or `\p{N}` character. Wrap the rag.ts FTS query in `.catch(() => [])` so retrieval degrades instead of failing.
- **Status:** fixed (`lib/rag.ts`, `lib/search.ts`). The RAG full-text query is wrapped in `.catch(() => [])`. `findPlants` also catches `searchPlantIds` failures (no results instead of 500). `tokenize()` drops tokens without a letter or digit.

### SEC-16 [Info] Pl@ntNet API key sent as a URL query parameter
- Location: `lib/plantnet.ts:12`
- Class: Secret exposure (logging)
- Impact: The Pl@ntNet API requires the key in the query string. It stays server-side, and thrown errors include only the status code. But any outbound proxy, APM or fetch-instrumentation log that records full URLs will capture the key.
- Fix: Keep error messages free of the URL, as they are now. Make sure no fetch logging or tracing captures query strings, and rotate the key if logs are shared.

### SEC-17 [Info] Login `redirectTo` check accepts backslash paths — *Needs confirmation*
- Location: `app/(public)/login/page.tsx:15-16`
- Class: Open redirect (potential)
- Impact: The check `raw.startsWith("/") && !raw.startsWith("//")` accepts `/\host`, which browsers treat as `//host`. Auth.js's default `redirect` callback should prefix relative URLs with `baseUrl`, which would neutralise this. I could not verify the v5-beta server-action path without `node_modules`.
- Fix: Also reject `\` and control characters, or resolve with `new URL(raw, base)` and require `url.origin === base.origin`.
- **Status:** fixed (`app/(public)/login/page.tsx`). `safeRedirectPath()` rejects `//`, backslashes and control characters, then resolves against a fixed base and requires the same origin.

### SEC-18 [Info] `AUTH_TRUST_HOST=true` assumes a trusted proxy
- Location: `.env.example:6`
- Class: Configuration assumption
- Impact: With `trustHost`, Auth.js builds callback and redirect URLs from `x-forwarded-host`/`host`. That's safe on Vercel, which sets these headers. Self-hosted behind a proxy that passes client-supplied `X-Forwarded-Host`, Auth.js redirects could point to an attacker's host.
- Fix: Set `AUTH_URL` to the canonical origin in production. Only enable `AUTH_TRUST_HOST` behind a proxy that overwrites forwarded headers.

### SEC-19 [Info] Honeypot answers a filled field with a 422 instead of silently dropping it
- Location: `lib/validation.ts:117`, `app/api/feedback/route.ts:10`
- Class: Anti-abuse logic
- Impact: `website: z.string().max(0)` makes zod reject a filled honeypot with a 422 that names the field. The "silently drop" branch never runs, and bots learn which field to leave empty.
- Fix: Use `website: z.string().max(200).optional()` and keep the `if (website) return { ok: true }` branch.
- **Status:** fixed (`lib/validation.ts`). `website: z.string().max(200).optional()`; the route's existing silent-drop branch now runs.

### SEC-20 [Info] Privacy: chat history and feedback PII are kept forever with no self-service deletion
- Location: `app/api/chat/route.ts:28-35`, `app/api/feedback/route.ts:12`, `prisma/schema.prisma` (ChatConversation/ChatMessage/Feedback)
- Class: Privacy / data minimisation
- Impact: Signed-in users' questions, which may describe health symptoms, are stored in full with their user id, along with the full answer payload. Feedback stores name, email and message. Only admins can read them (verified: `users` GET, `feedback` GET and admin pages all sit behind `requireAdmin` or the admin layout), and user deletion cascades. But there is no retention period, no user-facing way to view or delete history, and the privacy text doesn't cover this.
- Fix: Add a retention job (e.g. delete chats older than 90 days), a "delete my history" endpoint scoped to `session.user.id`, and a notice on the chat and contact forms. Consider not storing `payload`.

### SEC-21 [Info] Dependency risk: pre-release `next-auth` and no audit run
- Location: `package.json` (`next-auth` `5.0.0-beta.32`, `next` `15.5.26`)
- Class: Vulnerable / unstable dependencies
- Impact: The auth layer runs on a beta release pinned exactly, so security fixes arrive only through manual bumps. `next` 15.5.26 is well past the middleware-bypass fix (CVE-2025-29927, fixed in 15.2.3), and the admin layout re-checks the role anyway (`app/admin/layout.tsx:9-10`). I did not run `npm audit` because `node_modules` is absent. *Needs confirmation.*
- Fix: Run `npm audit --omit=dev` in CI. Track `next-auth` releases and move to v5 stable when it ships. Enable Dependabot or Renovate.

## Controls verified as working
- Every mutating API handler calls `requireAdmin()` itself (plants, references, feedback PATCH/DELETE, users PATCH, upload, reindex, and every `adminCrud` POST/PUT/DELETE) — `lib/crud.ts:21-45`, each route file.
- The admin UI re-checks the role on the server, separately from middleware — `app/admin/layout.tsx:9-10`.
- Public sign-up can't escalate privileges: `registerSchema` has no role field, zod strips unknown keys, and `role: "USER"` is hard-coded — `app/api/register/route.ts:9-12`, `lib/validation.ts:120-124`.
- Users PATCH accepts only `role` (zod enum), blocks self-demotion, and returns only `{id, role}` — `app/api/users/[id]/route.ts:11-17`. (See SEC-8 for the race.)
- Password hashing uses bcrypt cost 12, for users and for admins created by script (admin passwords at least 10 chars) — `app/api/register/route.ts:12`, `scripts/create-admin.ts:12-14`.
- Chat history is scoped to its owner: a foreign `conversationId` returns 404, and ids are validated as cuid — `app/api/chat/route.ts:23-26`, `lib/validation.ts:108`.
- Admin-only fields on `/api/references` are gated: `?all=1` works only for ADMIN sessions — `app/api/references/route.ts:13`.
- Raw SQL is parameterised: all `$queryRaw` use `Prisma.sql` with bound values, there is no `$queryRawUnsafe`, and ILIKE `%`, `_` and `\` are escaped — `lib/search.ts:58-76`, `lib/rag.ts:101-105`.
- Zod validates every mutating body (unknown keys stripped, lengths capped); catalogue query params are bounded; `plantType`/`availability` filters are allow-listed — `lib/validation.ts`, `lib/search.ts:103-105`.
- URL fields (`imageUrl`, `referenceUrl`, `audioUrl`) must be `https://`, which blocks `javascript:` and `data:` in `href`/`src` — `lib/validation.ts:12-19`.
- XSS: React escapes all LLM output and DB text. JSON-LD escapes `<`. The map uses React-Leaflet `<Popup>` JSX (no `bindPopup` strings), and `divIcon` HTML contains only numbers and a regex-validated hex colour — `components/Chatbot.tsx`, `app/(public)/plants/[slug]/page.tsx:64`, `components/PlantMap.tsx:35-45`, `lib/validation.ts:103`.
- Image uploads and identify check magic bytes (JPEG, PNG, WebP) and size — `lib/cloudinary.ts:16-22`, `app/api/upload/route.ts:13-15`, `app/api/identify/route.ts:20-22`.
- The Cloudinary signature is correct: SHA-1 over alphabetically sorted signed params (`folder`, `timestamp`) plus the secret; the secret never leaves the server — `lib/cloudinary.ts:25-36`.
- Server-only secrets: `ai`, `rag`, `chat`, `plantnet` and `cloudinary` import `server-only`; the Gemini key goes in the `x-goog-api-key` header, not the URL; only `NEXT_PUBLIC_MAP_URL`, `NEXT_PUBLIC_CAMPUS_*` and `NEXT_PUBLIC_SITE_URL` are read client-side — `lib/ai.ts:3,13`.
- RAG invariants: only VERIFIED references are indexed or attached; invented ids are dropped; citations and locations come from the database; the disclaimer is attached on every path, including no-match and LLM failure — `lib/rag.ts:12`, `lib/chat.ts:80-86,117,141-146`.
- Identify results attach only VERIFIED references — `app/api/identify/route.ts:31`.
- Public pages show PENDING references and mantras with a "pending" label, never as verified — `app/(public)/plants/[slug]/page.tsx:41-42,80-85`, `components/MantraAnimation.tsx:108`.
- Error handling: `handle()` returns generic 500s, and internal errors are only `console.error`'d — `lib/guards.ts:23-41`.
- Admin writes are audit-logged (create, update, delete, role change, upload, reindex) — `lib/crud.ts`, `lib/audit.ts`, route files.
- Session cookies use Auth.js defaults (HttpOnly, `SameSite=Lax`, `Secure`/`__Secure-` prefix on HTTPS) with no weakening overrides — `lib/auth.config.ts`.
- Server actions (`login`, `logout`) are covered by Next.js's built-in Origin/Host check; Auth.js routes use their own CSRF token — `app/(public)/login/page.tsx:13`, `components/Navbar.tsx:6`.
- Security headers `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy` and `Permissions-Policy` are applied to all routes; `images.remotePatterns` is limited to https `res.cloudinary.com` and `upload.wikimedia.org` — `next.config.ts`.
