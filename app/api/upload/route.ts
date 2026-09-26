import { handle, HttpError, requireAdmin } from "@/lib/guards";
import { audit } from "@/lib/audit";
import { AUDIO_TYPES, cloudinaryEnabled, MAX_AUDIO_BYTES, MAX_IMAGE_BYTES, sniffAudio, sniffImage, uploadToCloudinary } from "@/lib/cloudinary";
import { readFormData } from "@/lib/body";

export const POST = handle(async (req: Request) => {
  const admin = await requireAdmin();
  if (!cloudinaryEnabled()) throw new HttpError(503, "Cloudinary is not configured.");
  // The kind is only known after parsing, so the stream is capped at the larger (audio) limit.
  const form = await readFormData(req, MAX_AUDIO_BYTES, "Files must be 10 MB or smaller.");
  const file = form.get("file");
  const kind = form.get("kind") === "audio" ? "audio" : "image";
  if (!(file instanceof File)) throw new HttpError(400, "No file attached.");

  if (kind === "image") {
    if (file.size > MAX_IMAGE_BYTES) throw new HttpError(413, "Images must be 5 MB or smaller.");
    if (!sniffImage(new Uint8Array(await file.slice(0, 16).arrayBuffer()))) throw new HttpError(415, "Only JPG, PNG and WebP images are allowed.");
  } else {
    if (file.size > MAX_AUDIO_BYTES) throw new HttpError(413, "Audio must be 10 MB or smaller.");
    const sniffed = sniffAudio(new Uint8Array(await file.slice(0, 16).arrayBuffer()));
    if (!AUDIO_TYPES.includes(file.type) || !sniffed) throw new HttpError(415, "Only MP3, OGG, WAV or WebM audio is allowed.");
  }

  // Cloudinary stores audio under the "video" resource type.
  const url = await uploadToCloudinary(file, kind === "image" ? "haritima/plants" : "haritima/mantras", kind === "image" ? "image" : "video");
  await audit(admin.id, "UPLOAD", kind, undefined, { url });
  return Response.json({ url }, { status: 201 });
});
