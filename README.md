# हरिtima — Plant Identification, Recommendation and Benefits

A full-stack campus plant, Ayurveda and RAG-chatbot platform for **Dev Sanskriti Vishwavidyalaya (DSVV), Shantikunj, Haridwar**.
Developed as an academic (MCA) project.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui-style components, Framer Motion, Lucide |
| Backend | Next.js Route Handlers + Server Actions |
| Database | PostgreSQL (Neon / Supabase) + Prisma 6 |
| Auth | Auth.js (NextAuth v5) — credentials, JWT, roles `USER` / `ADMIN` |
| AI | Google Gemini (chat + embeddings) — RAG over the Haritima database only |
| Plant ID | Pl@ntNet identification API |
| Storage | Cloudinary (images + mantra audio), signed server-side uploads |
| Maps | Leaflet + OpenStreetMap |
| Hosting | Vercel |

## Architecture

```
Browser ──► Vercel (Next.js pages, API routes, middleware)
               │
               ├─► PostgreSQL (Neon)        plants, locations, references, mantras, KB chunks, users, audit log
               ├─► Cloudinary               plant images, mantra audio
               ├─► Gemini API               embeddings + grounded answer (server only)
               └─► Pl@ntNet API             image identification (server only)
```

### How "Ask Haritima" (RAG) works
1. Question → hybrid retrieval: embedding similarity on `KnowledgeDocument` chunks + PostgreSQL full-text search + plant-name match.
2. Only retrieved plants (with their benefits, locations and **VERIFIED** references) are passed to the LLM.
3. The LLM must return JSON that references only the supplied plant ids; the server drops anything else.
4. References and campus locations are attached **from the database**, never from the model.
   Plants without a verified reference show: *"Reference not available in the verified knowledge base."*
5. No evidence → *"I could not find a verified reference for this query in the Haritima knowledge base."*
6. Every answer carries the fixed educational disclaimer. Works in retrieval-only mode if no AI key is set.

## Folder structure

```
app/(public)     Home, plants, plants/[slug], map, ayurveda, chatbot, identify, mantras, about, contact, login, register, privacy, terms
app/admin        Dashboard, plants, locations, references, mantras, categories, knowledge, users, feedback, audit, settings
app/api          plants, locations, references, benefits, mantras, categories, chat, identify, upload, feedback, users, knowledge/reindex, stats, register, auth
components       Navbar, Footer, Logo, PlantCard, PlantFilters, PlantMap, Chatbot, MantraAnimation, PlantIdentifier, admin/*, ui/*
lib              prisma, auth, guards, validation (zod), search (FTS), ai, rag, chat, plantnet, cloudinary, rate-limit, audit, i18n/*
prisma           schema.prisma, seed.ts
scripts          create-admin.ts
```

## 1. Local development

Requirements: **Node.js 20+**, a PostgreSQL database (Neon free tier is easiest).

```bash
npm install
cp .env.example .env        # then fill the values (see below)
npx prisma migrate dev --name init
npm run db:seed
npm run create-admin
npm run dev                  # http://localhost:3000
```

## 2. Database setup (Neon)
1. Create a project at https://neon.tech → copy the **pooled** connection string.
2. Put it in `.env` as `DATABASE_URL="postgresql://...?...sslmode=require"`.
3. Run `npx prisma migrate dev --name init` (creates tables) and `npm run db:seed`.
   Supabase works the same way (use the connection string from Project Settings → Database).

## 3. Environment variables

| Variable | Required | Where to get it |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon / Supabase |
| `AUTH_SECRET` | ✅ | `npx auth secret` or `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | ✅ on Vercel | `true` |
| `AI_API_KEY` | recommended | https://aistudio.google.com/apikey |
| `AI_CHAT_MODEL` / `AI_EMBEDDING_MODEL` | optional | defaults `gemini-2.5-flash` / `gemini-embedding-001` |
| `PLANTNET_API_KEY` | for /identify | https://my.plantnet.org |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | for uploads | Cloudinary dashboard |
| `NEXT_PUBLIC_MAP_URL` | optional | tile URL; defaults to OpenStreetMap |
| `NEXT_PUBLIC_CAMPUS_LAT` / `NEXT_PUBLIC_CAMPUS_LNG` | optional | campus centre |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | for create-admin | your choice (password ≥ 10 chars) |

Only `NEXT_PUBLIC_*` values reach the browser. **Never commit `.env`.**

## 4. Admin account
```bash
npm run create-admin     # reads ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME from .env
```
Sign in at `/login` → "Admin dashboard" appears in the navbar. `/admin` and every write API are checked on the server.

After seeding (and whenever you add `AI_API_KEY`), open **Admin → Knowledge → Reindex** to build embeddings.

## 5. Deploy to Vercel
1. Push the project to GitHub.
2. Vercel → New Project → import repo (framework auto-detected).
3. Add all environment variables (Production + Preview), including `AUTH_TRUST_HOST=true` and `NEXT_PUBLIC_SITE_URL=https://your-domain`.
4. Apply migrations to the production DB once from your machine:
   ```bash
   DATABASE_URL="<production url>" npx prisma migrate deploy
   DATABASE_URL="<production url>" npm run db:seed
   ```
5. Deploy. Build command is `npm run build` (runs `prisma generate && next build`).

## 6. Production build (locally)
```bash
npm run build
npm start
```

## Security
Auth.js JWT sessions with bcrypt (12 rounds) · server-side role checks on all admin routes and APIs · zod validation on every input ·
Prisma (parameterised queries) · rate limiting on chat, identify, feedback, register · Origin check (CSRF) on mutating API calls ·
upload type (magic bytes) and size validation (5 MB image / 10 MB audio) · security headers · audit log for every admin change.
The in-memory rate limiter is per-instance; for heavy production traffic swap it for Upstash Redis.

## ⚠️ Before presenting / going live
- **Coordinates:** seed locations are *approximate* placeholders. Walk the campus, record GPS readings (e.g. Google Maps long-press), update them in Admin → Locations and untick "approximate".
- **References:** all seed references are `PENDING` — "Reference pending verification". Verify each against the original text (with Ayurveda faculty), fill text/chapter/verse, then mark `VERIFIED`. Never enter a citation you have not checked.
- **Photos:** upload real campus photos for each plant (Admin → Plants → Edit). A botanical placeholder is shown until then.
- The chatbot is educational only and never gives diagnosis or treatment.
"# Panda" 
