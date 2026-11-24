# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Haritima — campus plant catalogue, Ayurveda reference, campus map and RAG chatbot for Dev Sanskriti Vishwavidyalaya (DSVV), Haridwar. Academic MCA project. Next.js 15 App Router + React 19 + TypeScript, Prisma 6 on PostgreSQL (Neon/Supabase), Auth.js v5, Tailwind v4, deployed on Vercel.

## Commands

```bash
npm install                 # also runs prisma generate (postinstall)
npm run dev                 # http://localhost:3000
npm run build               # prisma generate && next build
npm run start               # prisma migrate deploy && next start (production; Railway runs this, so migrations apply on every deploy)
npm run lint                # next lint
npm run typecheck           # tsc --noEmit
npm run db:migrate          # prisma migrate dev  (no migrations committed yet; first run: npx prisma migrate dev --name init)
npm run db:deploy           # prisma migrate deploy (production)
npm run db:seed             # tsx prisma/seed.ts (resets child records of the 10 core plants)
npm run db:seed-extra       # add-only: 16 more plants
npm run db:seed-trails      # add-only: seasonal months + 2 walking trails
npm run db:suggest-refs     # fill suggested source books on untouched placeholder references
npm run db:studio
npm run create-admin        # reads ADMIN_EMAIL / ADMIN_PASSWORD (>=10 chars) / ADMIN_NAME from .env
```

There is no unit test suite. Verify changes with `npm run typecheck` and `npm run lint`. Chatbot behaviour is checked with Admin → Chatbot evaluation (`lib/eval.ts`); update its expected plants when seed data changes.

Setup requires a `.env` copied from `.env.example`. Only `DATABASE_URL` and `AUTH_SECRET` are mandatory; AI, Pl@ntNet and Cloudinary features degrade or are disabled without their keys. After seeding or adding `AI_API_KEY`, embeddings are built via Admin → Knowledge → Reindex (`/api/knowledge/reindex`).

## Feature map

Detailed per-feature summaries live in `docs/features/`. Read the relevant file before working on a feature, and update it when that feature's behavior changes.

| Feature | Summary file | Main code |
|---|---|---|
| Plant catalogue, search, categories | [docs/features/plants-catalogue.md](docs/features/plants-catalogue.md) | `app/(public)/plants`, `app/api/plants`, `lib/search.ts` |
| "Ask Haritima" RAG chatbot | [docs/features/chatbot-rag.md](docs/features/chatbot-rag.md) | `lib/chat.ts`, `lib/rag.ts`, `lib/ai.ts`, `app/api/chat` |
| Photo plant identification | [docs/features/plant-identification.md](docs/features/plant-identification.md) | `app/api/identify`, `lib/plantnet.ts` |
| Campus map and locations | [docs/features/campus-map.md](docs/features/campus-map.md) | `components/PlantMap.tsx`, `lib/map-data.ts`, `app/api/locations` |
| Campus walking trails | [docs/features/walking-trails.md](docs/features/walking-trails.md) | `app/(public)/trails`, `lib/trails.ts`, `components/TrailMap.tsx`, `app/api/trails`, `app/api/trail-stops` |
| Seasonal calendar | [docs/features/seasonal-calendar.md](docs/features/seasonal-calendar.md) | `app/(public)/seasons`, `components/SeasonStrip.tsx` |
| Analytics (views, chatbot usage) | [docs/features/analytics.md](docs/features/analytics.md) | `lib/analytics.ts`, `app/api/views`, `app/admin/analytics`, `components/admin/Charts.tsx` |
| Ayurveda references, benefits, verification | [docs/features/ayurveda-references.md](docs/features/ayurveda-references.md) | `app/api/references`, `app/api/benefits` |
| Mantras | [docs/features/mantras.md](docs/features/mantras.md) | `app/(public)/mantras`, `components/MantraAnimation.tsx` |
| Auth, roles, users | [docs/features/auth-users.md](docs/features/auth-users.md) | `lib/auth*.ts`, `middleware.ts`, `app/api/users` |
| Admin dashboard and audit log | [docs/features/admin-dashboard.md](docs/features/admin-dashboard.md) | `app/admin`, `components/admin`, `lib/crud.ts`, `lib/audit.ts` |
| Uploads and media (Cloudinary) | [docs/features/uploads-media.md](docs/features/uploads-media.md) | `app/api/upload`, `lib/cloudinary.ts` |
| Feedback and contact | [docs/features/feedback-contact.md](docs/features/feedback-contact.md) | `app/api/feedback`, `components/FeedbackForm.tsx` |
| i18n (English / Hindi) | [docs/features/i18n.md](docs/features/i18n.md) | `lib/i18n/*` |
| Security controls | [docs/features/security.md](docs/features/security.md) | `middleware.ts`, `lib/guards.ts`, `lib/rate-limit.ts` |

## Review agents

Project subagents live in `.claude/agents/` and pass their results through `docs/reviews/`:
1. `code-quality-reviewer` → writes `docs/reviews/code-quality.md` (read-only on source)
2. `security-auditor` → writes `docs/reviews/security.md` (read-only on source)
3. `code-improver` → reads both reports, applies fixes, runs typecheck/lint, and marks each finding's status

Run 1 and 2 first (they can run in parallel), then 3.

Slash commands in `.claude/commands/`:
- `/review-quality [scope]` runs agent 1.
- `/security-check [scope]` runs agent 2.
- `/improve-code [IDs or severity]` runs agent 3.
- `/review-all [scope]` runs 1 and 2 in parallel, then asks before running 3.

## Architecture

### Route groups
- `app/(public)/*` — public site. Pages are server components that query Prisma directly.
- `app/admin/*` — admin UI. Server components load rows with Prisma, then pass them to client components (`components/admin/ResourceManager.tsx`, `PlantForm.tsx`) that mutate via `fetch` to `app/api/*`.
- `app/api/*` — JSON route handlers; the only write path for data.

### Auth and access control (layered)
- `lib/auth.config.ts` is the **edge-safe** config (no Prisma/bcrypt) used by `middleware.ts`; `lib/auth.ts` adds the credentials provider with Prisma + bcrypt. Keep this split — importing Prisma into `auth.config.ts` breaks middleware.
- JWT sessions carry `id` and `role` (`USER` | `ADMIN`); types are augmented in `types/next-auth.d.ts`.
- `middleware.ts` (matcher `/admin/*`, `/api/*`) redirects non-admins away from `/admin` and blocks cross-origin non-GET API requests (CSRF via Origin/Host check).
- Middleware is only the first line: every mutating API must call `requireAdmin()` from `lib/guards.ts` itself.

### API handler conventions
- Wrap handlers in `handle()` (`lib/guards.ts`): it maps `HttpError` → status, Zod errors → 422, Prisma `P2025` → 404, `P2002` → 409, else 500.
- Validate bodies with schemas in `lib/validation.ts` (zod).
- Simple admin resources use the `adminCrud(entity, delegate, schema, reindex)` factory in `lib/crud.ts`, which gives POST/PUT/DELETE with `requireAdmin`, validation, `audit()` logging, and optional RAG re-index of the linked `plantId`. See `app/api/locations/route.ts` + `[id]/route.ts` for the pattern (list route exports GET + POST, `[id]` route exports PUT + DELETE).
- Plants have a hand-written route (`app/api/plants/[id]/route.ts`) because of category relations; it also calls `audit()` and `indexPlant()`.
- Every admin write must be audit-logged (`lib/audit.ts`), and any change to plant data, benefits, locations or references must re-index that plant.
- Public abuse-prone endpoints (chat, identify, feedback, register, views) use the in-memory `rateLimit()` from `lib/rate-limit.ts` (per-instance only).

### Search and RAG chatbot ("Ask Haritima")
- `lib/search.ts` — tokenizer with light stemming, stopwords and an English/Hindi/Ayurvedic-term `SYNONYMS` map; builds OR prefix `tsquery`s. `searchPlantIds` does PostgreSQL `simple` full-text + ILIKE over plant fields; `findPlants` powers the catalogue filters.
- `lib/rag.ts` — `indexPlant()` rebuilds `KnowledgeDocument` chunks for a plant (plant summary, traditional uses, benefits, and **only VERIFIED references**) with embeddings stored as `Float[]` (768-dim, cosine computed in JS, no pgvector). `retrievePlantIds()` combines vector similarity (threshold `RAG_MIN_SIMILARITY`, default 0.6), FTS on chunks and name match.
- `lib/ai.ts` — server-only Gemini REST client (`generateJSON`, `embed`); `aiEnabled()` gates on `AI_API_KEY`.
- `lib/chat.ts` — `answerQuestion()`: retrieves plants, sends only their DB records to the LLM, which must return JSON referencing supplied plant ids; unknown ids are dropped. **Citations and locations are attached from the DB, never from the model.** Includes fixed disclaimer, no-match and "reference not available" texts, and an urgent-symptom regex. Works in retrieval-only mode without an AI key.
- Invariants to preserve: the model never writes citations; no diagnosis/doses; unverified references are never presented as verified.

### Data model notes (`prisma/schema.prisma`)
- Bilingual content uses parallel `*Hi` fields (`descriptionHi`, `traditionalUsesHi`, `concernHi`, `nameHi`, …). Display with `pick(lang, en, hi)` from `lib/i18n/pick.ts`.
- `AyurvedicReference.verificationStatus` (PENDING / VERIFIED / REJECTED) drives what the chatbot and public pages show.
- `PlantLocation.isApproximate` flags unsurveyed GPS coordinates (all seed coordinates are approximate).

### i18n
- Languages `en` and `hi`, selected by the `haritima-lang` cookie. UI strings live in `lib/i18n/dictionaries.ts`; server components use `getDictionary()` (`lib/i18n/server.ts`), client components use `lib/i18n/client.tsx`. New UI strings must be added to both dictionaries.

### Server-only modules and external services
- `lib/ai.ts`, `lib/rag.ts`, `lib/chat.ts`, `lib/plantnet.ts`, `lib/cloudinary.ts` and `lib/i18n/server.ts` import `server-only`; never import them from client components. Cloudinary uploads go through `/api/upload` (signed, with magic-byte and size checks: 5 MB image / 10 MB audio). Only `NEXT_PUBLIC_*` env vars reach the browser.
- Remote images are allowed only from `res.cloudinary.com` and `upload.wikimedia.org` (`next.config.ts`), which also sets security headers.
- The map (`components/PlantMap.tsx`) uses Leaflet and is loaded client-only via `PlantMapLoader.tsx`.

## Content rules (from README)
- Seed references are all `PENDING`. Never add or mark a citation as VERIFIED unless it has been checked against the source text.
- The chatbot is educational only and must not give diagnosis or treatment.
