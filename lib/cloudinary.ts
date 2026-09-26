import "server-only";
import { createHash } from "crypto";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/ogg", "audio/wav", "audio/webm"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export function cloudinaryEnabled() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET,
  );
}

/** Checks magic bytes so a renamed file can't pass as an image. */
export function sniffImage(buf: Uint8Array) {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45)
    return "image/webp";
  return null;
}

/** Checks audio magic bytes (MP3, OGG, WAV, WebM) so the client-supplied MIME type isn't trusted. */
export function sniffAudio(buf: Uint8Array) {
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return "audio/mpeg"; // "ID3" tag
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return "audio/mpeg"; // MPEG frame sync
  if (buf[0] === 0x4f && buf[1] === 0x67 && buf[2] === 0x67 && buf[3] === 0x53) return "audio/ogg"; // "OggS"
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x41 && buf[10] === 0x56 && buf[11] === 0x45
  )
    return "audio/wav"; // "RIFF....WAVE"
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return "audio/webm"; // EBML
  return null;
}

/** Signed server-side upload; the API secret never reaches the browser. */
export async function uploadToCloudinary(file: File, folder: string, resourceType: "image" | "video") {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME!;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const toSign = `folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`;
  const signature = createHash("sha1").update(toSign).digest("hex");

  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  form.append("timestamp", timestamp);
  form.append("api_key", process.env.CLOUDINARY_API_KEY!);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${resourceType}/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Cloudinary upload failed: ${res.status}`);
  const data = (await res.json()) as { secure_url: string };
  return data.secure_url;
}
