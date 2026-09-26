# Ayurveda: references, benefits and verification

Traditional uses are tied to textual sources, and a source counts as trusted only after an admin verifies it.

## Files
- Page: `app/(public)/ayurveda/page.tsx` (counts of verified and pending references, benefit concerns grouped with plant counts)
- API: `app/api/references/route.ts`, `app/api/references/[id]/route.ts`, `app/api/benefits/route.ts`, `app/api/benefits/[id]/route.ts`
- Admin: `app/admin/references/page.tsx`, `app/admin/knowledge/page.tsx` (benefits editor)
- Validation: `referenceSchema`, `benefitSchema` in `lib/validation.ts`

## Data
- `AyurvedicReference`:
  - fields: `textName`, `author`, `chapter`, `section`, `verse`, `citation`, `referenceUrl` (https only), `sourceType` enum
  - `verificationStatus`: `PENDING` (default), `VERIFIED` or `REJECTED`
  - `verifiedBy` and `verifiedAt`, which the server sets
  - `notes`
- `PlantBenefit`: a single documented association.
  - `concern` is a lowercased keyword such as "sleep", with an optional `concernHi`.
  - Also has `description`, `plantPart`, and an optional link to a reference (set to null if that reference is deleted).
  - The catalogue's `use` filter matches `concern`.

## Verification rules (enforced in the API)
- Only an admin can create or modify records.
- `verifiedBy` (the admin's email or id) and `verifiedAt` are set **only** when the status changes to VERIFIED. They are cleared whenever the status is anything else. Clients can never set them directly.
- Public GET `/api/references` returns only VERIFIED references. An admin can pass `?all=1` to see every status and every field.
- Public APIs (`/api/references` and the references included in `/api/plants/[id]`) return only the fields in `PUBLIC_REFERENCE_SELECT` (`lib/public-select.ts`). `verifiedBy`, `verifiedAt` and `notes` are never public.
- Plant detail pages show VERIFIED and PENDING references (the latter with a "pending" badge) and never show REJECTED ones.
- Only VERIFIED references are indexed into the chatbot knowledge base.
- Every create, update or delete re-indexes the plant and writes an audit entry, including the status change from → to.

## Content rule
All seed references are `PENDING`. Never mark a citation VERIFIED, or invent one, without checking it against the original text.
