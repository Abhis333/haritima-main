"use client";

import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Input } from "../ui/input";

/** Uploads to /api/upload (admin-only, server-signed Cloudinary) and stores the returned URL in a form field. */
export function FileUploadField({ id, name, kind, defaultValue = "" }: { id: string; name: string; kind: "image" | "audio"; defaultValue?: string }) {
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Upload failed.");
    setUrl(data.url);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input id={id} name={name} type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        <label className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-forest/30 px-4 text-sm text-forest hover:bg-forest/5">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
          <input type="file" className="sr-only" accept={kind === "image" ? "image/jpeg,image/png,image/webp" : "audio/*"} onChange={(e) => upload(e.target.files?.[0])} />
        </label>
      </div>
      {kind === "image" && url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Preview" className="h-32 w-48 rounded-md object-cover" />
      )}
      {kind === "audio" && url && <audio controls src={url} className="h-9" />}
      {error && <p role="alert" className="text-sm text-[#8a2e22]">{error}</p>}
    </div>
  );
}
