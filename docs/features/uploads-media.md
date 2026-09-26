# Uploads and media (Cloudinary)

Admins upload plant images and mantra audio through signed server-side uploads to Cloudinary.

## Files
- API: `app/api/upload/route.ts` (admin only)
- Logic: `lib/cloudinary.ts`, which provides `cloudinaryEnabled`, `sniffImage`, `sniffAudio`, `uploadToCloudinary`, `IMAGE_TYPES`, `AUDIO_TYPES`, `MAX_IMAGE_BYTES` (5 MB) and `MAX_AUDIO_BYTES` (10 MB)
- UI: `components/admin/FileUploadField.tsx`, used in `PlantForm` and the mantras admin page
- Display: `components/PlantImage.tsx` (shows a botanical placeholder when there's no image)

## Flow
1. Multipart form data: `file`, plus `kind` set to `image` (default) or `audio`.
2. Images must be ≤ 5 MB and pass a **magic-byte** check for JPG, PNG or WebP, so a renamed file is rejected. Audio must be ≤ 10 MB, have a MIME type in `AUDIO_TYPES` **and** pass a magic-byte check (`sniffAudio`: ID3/MPEG frame sync, `OggS`, `RIFF…WAVE`, WebM/EBML). The request body is parsed with `readFormData` (`lib/body.ts`), which rejects a too-large `Content-Length` early and stops reading once the stream passes 10 MB plus 64 KB of multipart overhead. On Vercel the platform's ~4.5 MB request-body cap still applies first.
3. The upload is signed with SHA-1 over `folder` + `timestamp` + the API secret, so the secret stays on the server. Images go to `haritima/plants`. Audio goes to `haritima/mantras` under Cloudinary's `video` resource type.
4. The handler returns `{ url }` (the `secure_url`) and writes an audit entry with action `UPLOAD`. The client then saves that URL into `imageUrl` or `audioUrl`, which zod requires to be https.

## Notes
- Returns 503 when the `CLOUDINARY_*` env vars are missing.
- `next.config.ts` allows remote images only from `res.cloudinary.com` and `upload.wikimedia.org`. Add any new image host there.
