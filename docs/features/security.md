# Security controls

These are the defenses across the app, and where each one lives.

| Control | Where |
|---|---|
| Admin page gate (redirects to `/login`) | `middleware.ts`, `authorized` callback in `lib/auth.config.ts`; `app/admin/layout.tsx` re-reads the role from the database |
| Server-side role check on every admin API. `requireAdmin()` re-reads the user's role from the database on each call, so a demotion or account deletion takes effect at once rather than when the JWT expires | `requireAdmin()` in `lib/guards.ts` |
| Sessions: JWT, 1-day `maxAge`, refreshed at most hourly (`updateAge`) while in use | `lib/auth.config.ts` |
| CSRF: a non-GET `/api/*` request is rejected with 403 when its `Origin` host is not this site (the `Host` / `X-Forwarded-Host` header or the `NEXT_PUBLIC_SITE_URL` host), when `Origin` is malformed (e.g. `null`), or, if `Origin` is missing, when `Sec-Fetch-Site` reports another site. Auth.js protects its own routes | `middleware.ts` |
| Input validation with zod on every body and query | `lib/validation.ts` |
| SQL safety: Prisma, plus `Prisma.sql` tagged templates for raw full-text queries; ILIKE wildcards are escaped. Search tokens must contain a letter or digit, and a failing full-text query degrades to "no hits" instead of a 500 | `lib/search.ts`, `lib/rag.ts` |
| Password hashing with bcrypt at 12 rounds; public sign-up can never create an admin | `app/api/register/route.ts`, `lib/auth.ts` |
| Sign-in throttling: 5 attempts per email and 20 per client address per 15 minutes, checked before bcrypt. A throttled attempt looks the same as a wrong password. Unknown emails are compared against a dummy hash so response time doesn't reveal which emails exist | `authorize()` in `lib/auth.ts` |
| Rate limits: chat 12 or 6 per minute, identify 8 per minute, feedback 3 per 10 minutes, register 5 per hour | `lib/rate-limit.ts` plus each route |
| Upload checks: image and audio magic bytes, MIME type and size; signed Cloudinary uploads. Multipart bodies are size-capped while streaming (and by `Content-Length`) before being parsed | `lib/cloudinary.ts`, `lib/body.ts`, `app/api/upload/route.ts`, `app/api/identify/route.ts` |
| Public reference data: public APIs return an explicit field list, so `verifiedBy` (admin email) and reviewer `notes` are admin-only | `lib/public-select.ts`, `app/api/references/route.ts`, `app/api/plants/[id]/route.ts` |
| Atomic last-admin guard: admin rows are locked (`SELECT … FOR UPDATE`) in a transaction, so concurrent demotions can't leave zero admins | `app/api/users/[id]/route.ts` |
| Login redirect: `callbackUrl` must be a same-site relative path; `//`, backslashes and control characters fall back to `/` | `app/(public)/login/page.tsx` |
| Security headers: `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` | `next.config.ts` |
| Server-only secrets: AI, Pl@ntNet and Cloudinary modules import `server-only`; only `NEXT_PUBLIC_*` reaches the browser | `lib/*.ts` |
| Audit log of every admin write | `lib/audit.ts` |
| Honeypot on the contact form: any value passes validation, and a filled field is silently dropped with a normal `{ ok: true }` | `feedbackSchema.website`, `app/api/feedback/route.ts` |
| Chat history is scoped to its owner (someone else's conversation id returns 404) | `app/api/chat/route.ts` |
| Output guard: ids the LLM invents are dropped, and citations come only from the database. Model text containing doses, diagnosis/cure wording or classical text / citation markers is replaced with database text. Emergency wording returns only the urgent message and disclaimer | `lib/chat.ts` |

## Rate-limit client key
`clientKey()` uses `x-vercel-forwarded-for`, then `x-real-ip`, then the **right-most** `x-forwarded-for` hop (the one the nearest proxy added). The client-controlled left-most value is never used. IPv6 addresses are grouped by /64. When the map passes 5,000 keys, expired entries are evicted first, then the least recently used. It no longer clears every counter.

## Known limitation
`rateLimit()` keeps its data in memory for each server instance. On Vercel each instance keeps its own counts, so the README suggests switching to Upstash Redis for strict global limits. There is also no global daily cap yet on Gemini / Pl@ntNet calls. The login limiter is per instance too, and a per-email limit lets someone temporarily block sign-in for a known email (the trade-off for slowing password guessing).

## Error responses
`handle()` maps errors to clean JSON responses:
- `HttpError` → its own status code
- Zod error → 422, with the validation issues
- Prisma `P2025` → 404
- Prisma `P2002` → 409
- anything else → a generic 500, with the error printed on the server
