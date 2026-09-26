# Security improvements — action list (2026-09-25)

Derived from `docs/reviews/security.md` (21 findings: Critical 0 · High 0 · Medium 5 · Low 10 · Info 6).
Full evidence and line numbers are in that report; this file is the to-do list, in priority order.

## Priority 1 — Medium (fix in code now)

| ID | What to improve | Where |
|---|---|---|
| SEC-1 | Public reference GETs must use an explicit `select` so `verifiedBy` (admin email) and `notes` are not returned; only admins with `?all=1` see them. | `app/api/references/route.ts`, `app/api/plants/[id]/route.ts` |
| SEC-2 | `requireAdmin()` should re-read the user's role from the database instead of trusting the JWT; shorten session `maxAge`. | `lib/guards.ts`, `lib/auth.config.ts` |
| SEC-3 | Rate-limit sign-in attempts per email and per IP inside `authorize()`. | `lib/auth.ts` |
| SEC-4 | Filter model-written `context` / `association` text: blank it when it contains doses, diagnosis wording or classical text names. | `lib/chat.ts` |
| SEC-5 | Rate limiter: take client IP from platform headers (`x-real-ip` / `x-vercel-forwarded-for`), evict only expired entries instead of clearing all. Shared store (Upstash) is a later infra step. | `lib/rate-limit.ts` |

## Priority 2 — Low (fix in code now)

| ID | What to improve | Where |
|---|---|---|
| SEC-6 | Origin check: catch invalid `Origin` (e.g. `null`) and return 403; fall back to `Sec-Fetch-Site` when Origin is missing. | `middleware.ts` |
| SEC-7 | Always run a bcrypt compare (dummy hash) when the email is unknown, to remove login timing difference. | `lib/auth.ts` |
| SEC-8 | Make the "last admin" guard atomic (transaction) and skip it when the target isn't an admin. | `app/api/users/[id]/route.ts` |
| SEC-11 | Compute embeddings first, then delete+insert chunks in one transaction; don't fire-and-forget re-indexing (use `after()` or `await`). | `lib/rag.ts`, plant routes |
| SEC-12 | Check audio magic bytes (MP3/OGG/WAV/WebM) on upload, not just the client MIME type. | `app/api/upload/route.ts` |
| SEC-13 | Reject oversized requests early using `Content-Length` before `formData()`. | `app/api/identify/route.ts`, `app/api/upload/route.ts` |
| SEC-14 | Broaden urgent-symptom regex (incl. Hindi / romanised Hindi); when urgent, return only the warning + disclaimer, no plants. | `lib/chat.ts` |
| SEC-15 | Wrap the RAG full-text query in a catch so a bad `tsquery` degrades instead of returning 500. | `lib/rag.ts`, `lib/search.ts` |

## Priority 3 — Info (small code fixes)

| ID | What to improve | Where |
|---|---|---|
| SEC-17 | Reject `\` and control characters in login `redirectTo`, or verify same origin via `new URL`. | `app/(public)/login/page.tsx` |
| SEC-19 | Honeypot field: accept any value in the schema and silently drop filled submissions. | `lib/validation.ts` |

## Needs a decision or infrastructure (not auto-fixed)

| ID | What to improve | Why deferred |
|---|---|---|
| SEC-5 (part) | Shared rate limiter (Upstash), global daily cap on Gemini / Pl@ntNet calls. | Needs a new service and env keys. |
| SEC-9 | Nonce-based Content-Security-Policy and HSTS. | Must be tested in a browser against Leaflet, framer-motion, map tiles. |
| SEC-10 | pgvector index or embedding cache; one time budget for the whole chat request. | Database/architecture change. |
| SEC-16 | Make sure no logging captures the Pl@ntNet URL (key in query string). | Deployment/logging config. |
| SEC-18 | Set `AUTH_URL` in production; only use `AUTH_TRUST_HOST` behind a trusted proxy. | Environment config. |
| SEC-20 | Retention period for chat history / feedback, "delete my history" endpoint, privacy notice. | Product/privacy decision. |
| SEC-21 | Install deps and run `npm audit --omit=dev`; track `next-auth` v5 stable; enable Dependabot. | Needs `node_modules` / CI. |
