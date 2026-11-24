# Mantras

Nature, peace and well-being mantras, each shown with its Sanskrit text, translations, source, and optional audio.

## Files
- Page: `app/(public)/mantras/page.tsx` (filter with `?category=`; the featured mantra also appears on the home page)
- Component: `components/MantraAnimation.tsx` (`MantraText`, a Framer Motion reveal that splits text by grapheme so Devanagari conjuncts stay intact, and that respects `useReducedMotion`; the reduced-motion markup is applied only after mount so server and client HTML match)
- API: `app/api/mantras/route.ts` (public GET, admin POST), `app/api/mantras/[id]/route.ts` (admin PUT/DELETE through `adminCrud`, with no re-indexing)
- Admin: `app/admin/mantras/page.tsx`, including audio upload
- Validation: `mantraSchema`

## Data
- `Mantra` fields:
  - text: `title`, `sanskritText`, `transliteration`, `hindiTranslation`, `englishTranslation`, `meaning`
  - `source` (for example "Rigveda 3.62.10")
  - `verificationStatus`
  - `category`, which is one of `Nature | Peace | Health | Environment | Knowledge | Well-being`
  - `audioUrl` (https) and `featured`

## Notes
- Public lists exclude REJECTED mantras (the shared `PUBLIC_MANTRA_WHERE` in `lib/public-select.ts`, used by `/mantras`, `/api/mantras` and the home-page featured mantra), and PENDING ones are shown with a pending badge.
- Audio is uploaded through `/api/upload` with `kind=audio`. Cloudinary stores it in the `haritima/mantras` folder under its "video" resource type. See [uploads-media.md](uploads-media.md).
- Mantras are not part of the chatbot knowledge base.
