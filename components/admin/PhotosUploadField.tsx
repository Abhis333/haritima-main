"use client";

import { useState } from "react";
import { Camera, Loader2, X } from "lucide-react";

const MAX_EDGE = 1600;

/** Phone photos are often over the 5 MB upload limit: re-encode to a JPEG of at most 1600 px. Falls back to the original file. */
async function shrink(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1_500_000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

/**
 * Several images uploaded to /api/upload (admin-only, server-signed Cloudinary).
 * On phones the picker offers the camera or the gallery. Each URL is submitted as a hidden `name` input,
 * so the form reads them with FormData.getAll(name).
 */
export function PhotosUploadField({ id, name, defaultValue = [], max }: { id: string; name: string; defaultValue?: string[]; max: number }) {
  const [urls, setUrls] = useState<string[]>(defaultValue);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const picked = [...files].slice(0, max - urls.length);
    if (picked.length < files.length) setError(`Only ${max} photos per location; extra photos were skipped.`);
    setBusy(picked.length);
    await Promise.all(
      picked.map(async (file) => {
        const fd = new FormData();
        fd.append("file", await shrink(file));
        fd.append("kind", "image");
        const res = await fetch("/api/upload", { method: "POST", body: fd }).catch(() => null);
        const data = res ? await res.json().catch(() => ({})) : {};
        if (res?.ok && data.url) setUrls((u) => [...u, data.url]);
        else setError(data.error ?? "A photo failed to upload. Images must be JPG, PNG or WebP up to 5 MB.");
        setBusy((b) => b - 1);
      }),
    );
  }

  return (
    <div className="space-y-2">
      {urls.map((u) => <input key={u} type="hidden" name={name} value={u} />)}
      <ul className="flex flex-wrap gap-2">
        {urls.map((u) => (
          <li key={u} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="Location photo" className="h-24 w-24 rounded-md object-cover" />
            <button
              type="button"
              onClick={() => setUrls((list) => list.filter((x) => x !== u))}
              className="absolute -right-2 -top-2 rounded-full bg-ink p-1 text-white shadow"
              aria-label="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
        {urls.length < max && (
          <li>
            <label htmlFor={id} className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-forest/40 text-xs text-forest hover:bg-forest/5">
              {busy > 0 ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              {busy > 0 ? `Uploading ${busy}…` : "Add photos"}
            </label>
            <input
              id={id}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={(e) => { upload(e.target.files); e.target.value = ""; }}
            />
          </li>
        )}
      </ul>
      {error && <p role="alert" className="text-sm text-[#8a2e22]">{error}</p>}
    </div>
  );
}
