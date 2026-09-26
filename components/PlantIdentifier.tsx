"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, Camera, Loader2, MapPin } from "lucide-react";
import { useLang } from "@/lib/i18n/client";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

type Match = {
  scientificName: string;
  commonNames: string[];
  family: string | null;
  confidence: number;
  plant: null | {
    slug: string;
    commonName: string;
    hindiName: string | null;
    traditionalUses: string[];
    verifiedReferences: { textName: string; citation: string }[];
    location: { campusArea: string; isApproximate: boolean } | null;
  };
};
type Result = { lowConfidence: boolean; matches: Match[] };

const MAX = 5 * 1024 * 1024;

export function PlantIdentifier() {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [organ, setOrgan] = useState("auto");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  function choose(f: File | undefined) {
    setResult(null);
    setError(null);
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return setError("Use a JPG, PNG or WebP photo.");
    if (f.size > MAX) return setError("The photo is larger than 5 MB. Choose a smaller one.");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function run() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("organ", organ);
      const res = await fetch("/api/identify", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Identification failed.");
      setResult(data as Result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Identification failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr]">
      <div className="space-y-4">
        <label
          htmlFor="plant-photo"
          className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-moss/60 bg-[#eef1e2] text-forest transition-colors hover:bg-[#e6ebd6]"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Selected plant" className="h-full w-full object-cover" />
          ) : (
            <>
              <Camera className="h-8 w-8" />
              <span>{t.identify.choose}</span>
            </>
          )}
        </label>
        <input id="plant-photo" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(e) => choose(e.target.files?.[0])} />

        <fieldset>
          <legend className="text-sm text-muted-foreground">{t.identify.organ}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(t.identify.organs) as (keyof typeof t.identify.organs)[]).map((o) => (
              <label key={o} className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${organ === o ? "border-forest bg-forest text-sandal" : "border-parch bg-card"}`}>
                <input type="radio" name="organ" value={o} checked={organ === o} onChange={() => setOrgan(o)} className="sr-only" />
                {t.identify.organs[o]}
              </label>
            ))}
          </div>
        </fieldset>

        <Button onClick={run} disabled={!file || busy} className="w-full" size="lg">
          {busy ? <Loader2 className="animate-spin" /> : null} {busy ? t.identify.running : t.identify.run}
        </Button>
        {error && <p role="alert" className="text-[#8a2e22]">{error}</p>}
      </div>

      <div aria-live="polite" className="space-y-4">
        {result?.lowConfidence && (
          <div className="flex items-start gap-2 rounded-md border border-[#e0c483] bg-[#f3e2bd] px-4 py-3 text-[#7a5a14]" role="alert">
            <AlertTriangle className="mt-1 h-4 w-4 shrink-0" /> {t.identify.low}
          </div>
        )}
        {result && result.matches.length === 0 && <p className="text-muted-foreground">{t.identify.none}</p>}
        {result?.matches.map((m) => (
          <article key={m.scientificName} className="rounded-lg border border-parch bg-card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="sci text-xl">{m.scientificName}</h3>
              <span className="text-sm text-muted-foreground">
                {t.identify.confidence}: <strong className="text-forest">{Math.round(m.confidence * 100)}%</strong>
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-parch">
              <div className="h-full rounded-full bg-leaf" style={{ width: `${Math.round(m.confidence * 100)}%` }} />
            </div>
            {m.commonNames.length > 0 && <p className="mt-2 text-sm text-muted-foreground">{m.commonNames.slice(0, 4).join(", ")}{m.family ? ` — ${m.family}` : ""}</p>}
            {m.plant ? (
              <div className="mt-4 space-y-2 border-t border-parch pt-4">
                <Badge variant="leaf">{t.identify.onCampus}</Badge>
                <p className="text-lg font-semibold text-forest">
                  {m.plant.commonName} {m.plant.hindiName && <span className="deva font-normal">/ {m.plant.hindiName}</span>}
                </p>
                {m.plant.traditionalUses.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5 text-[0.95rem]">
                    {m.plant.traditionalUses.slice(0, 3).map((u) => <li key={u}>{u}</li>)}
                  </ul>
                )}
                <p className="text-sm">
                  {m.plant.verifiedReferences.length
                    ? m.plant.verifiedReferences.map((r) => `${r.textName} — ${r.citation}`).join("; ")
                    : <span className="text-[#7a5a14]">{t.plant.noRefs}</span>}
                </p>
                {m.plant.location && (
                  <p className="flex items-center gap-1 text-sm"><MapPin className="h-4 w-4" /> {m.plant.location.campusArea}{m.plant.location.isApproximate ? ` (${t.map.approximate})` : ""}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <Button asChild size="sm"><Link href={`/plants/${m.plant.slug}`}>{t.plants.view}</Link></Button>
                  {m.plant.location && <Button asChild size="sm" variant="outline"><Link href={`/map?plant=${m.plant.slug}`}>{t.plant.viewOnMap}</Link></Button>}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{t.identify.notInDb}</p>
            )}
          </article>
        ))}
        {result && <p className="text-sm text-muted-foreground">{t.common.disclaimerShort}</p>}
      </div>
    </div>
  );
}
