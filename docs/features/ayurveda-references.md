# Ayurveda: references, benefits and verification

Traditional uses are tied to textual sources, and a source counts as trusted only after an admin verifies it.

## Files
- Page: `app/(public)/ayurveda/page.tsx` (counts of verified and pending references, benefit concerns grouped with plant counts)
- API: `app/api/references/route.ts`, `app/api/references/[id]/route.ts`, `app/api/benefits/route.ts`, `app/api/benefits/[id]/route.ts`
- Admin: `app/admin/references/page.tsx`, `app/admin/knowledge/page.tsx` (benefits editor), `app/admin/references/print/page.tsx` (printable verification sheet: PENDING references by default, `?status=all` for every status; one block per reference with the plant, linked associations, stored values in grey, blanks for edition/chapter/verse/page, outcome tick boxes and reviewer name/designation/signature/date). The sheet only prints; status changes are still made in the references editor.
- Validation: `referenceSchema`, `benefitSchema` in `lib/validation.ts`

## Data
- `AyurvedicReference`:
  - fields: `textName`, `author`, `chapter`, `section`, `verse`, `citation`, `referenceUrl` (https only), `sourceType` enum
  - `verificationStatus`: `PENDING` (default), `VERIFIED` or `REJECTED`
  - `verifiedBy` and `verifiedAt`, which the server sets
  - `notes`
- `PlantBenefit`: a single documented association.
  - `concern` is a lowercased keyword such as "sleep", with an optional `concernHi`.
  - Also has `description`, `plantPart`, and an optional link to a reference (set to null if that reference is deleted). The benefits editor (Admin → Knowledge, "Supporting reference") offers every non-REJECTED reference labelled with its status, plus any reference a benefit already links to, so editing a benefit linked to a PENDING reference keeps the link. Linking a benefit to a PENDING reference does not make it citable: only VERIFIED references are indexed or shown in answers.
  - The catalogue's `use` filter matches `concern`.

## Verification rules (enforced in the API)
- Only an admin can create or modify records.
- `verifiedBy` (the admin's email or id) and `verifiedAt` are set **only** when the status changes to VERIFIED. They are cleared whenever the status is anything else. Clients can never set them directly.
- Editing a VERIFIED reference's citation fields (`plantId`, `textName`, `author`, `chapter`, `section`, `verse`, `citation`, `referenceUrl`, `sourceType`) while leaving the status on VERIFIED resets it to PENDING and clears `verifiedBy`/`verifiedAt`; the audit entry records the changed fields and `resetToPending: true`. To record a re-check, save it (it becomes PENDING), then set VERIFIED again, which re-stamps the verifier. Editing only `notes` keeps it VERIFIED.
- Public GET `/api/references` returns only VERIFIED references. An admin can pass `?all=1` to see every status and every field.
- Public APIs (`/api/references` and the references included in `/api/plants/[id]`) return only the fields in `PUBLIC_REFERENCE_SELECT` (`lib/public-select.ts`). `verifiedBy`, `verifiedAt` and `notes` are never public.
- Plant detail pages show VERIFIED and PENDING references (the latter with a "pending" badge) and never show REJECTED ones.
- Only VERIFIED references are indexed into the chatbot knowledge base.
- Every create, update or delete re-indexes the plant and writes an audit entry, including the status change from → to. When an update moves a reference or benefit to another plant, both the old and the new plant are re-indexed.

## Content rule
All seed references are `PENDING`. Never mark a citation VERIFIED, or invent one, without checking it against the original text.

## Suggested source books
- `prisma/reference-suggestions.ts` maps each seed plant to a suggested book: *Bhavaprakasha Nighantu* (Bhavamishra) for most, *The Ayurvedic Pharmacopoeia of India* (Ministry of AYUSH) for Kalmegh, and *Indian Medicinal Plants* (Kirtikar & Basu) for Lemongrass, Mint and Marigold.
- Both seed scripts use it; `npm run db:suggest-refs` applies it to existing untouched placeholder rows only.
- Suggestions are not citations: rows stay PENDING with chapter/section/verse empty until a verifier confirms the source and marks VERIFIED.
