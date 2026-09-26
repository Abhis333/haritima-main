# Photo plant identification

A user uploads a photo, Pl@ntNet suggests species, and the suggestions are matched against Haritima records.

## Files
- Page: `app/(public)/identify/page.tsx`
- Component: `components/PlantIdentifier.tsx` (client; sends multipart data to `/api/identify`)
- API: `app/api/identify/route.ts` (`maxDuration = 40`)
- Logic: `lib/plantnet.ts` (`identifyWithPlantNet`, `binomial`), `lib/cloudinary.ts` (`sniffImage`, `MAX_IMAGE_BYTES`, reused for validation only; nothing is uploaded)

## Flow
1. Form fields: `image` (File) and `organ`, which is one of `leaf | flower | fruit | bark | auto`.
2. Checks, in this order:
   - rate limit: 8 per minute per IP
   - file present
   - organ is valid
   - size ≤ 5 MB (the multipart body is capped while streaming by `readFormData` in `lib/body.ts`, and a too-large `Content-Length` is rejected before parsing)
   - magic bytes show JPG, PNG or WebP
   - `PLANTNET_API_KEY` is set (returns 503 otherwise)
3. `identifyWithPlantNet` calls `https://my-api.plantnet.org/v2/identify/all` and gets 5 results. A Pl@ntNet 404 means "no match" and yields an empty list.
4. Each candidate is matched to a Haritima plant by `binomial()` (genus + species epithet, lowercased, with author abbreviations removed). The match checks the plant's `scientificName` and its `otherNames`.
5. The response is `{ lowConfidence, matches[] }`. `lowConfidence` is true when there are no matches or the top score is below 0.35. A matched plant includes its traditional uses, VERIFIED references and first location.

## Notes
- The photo is never stored. It is only forwarded to Pl@ntNet.
- `next.config.ts` sets `Permissions-Policy: camera=(self)` so the page can use the device camera.
