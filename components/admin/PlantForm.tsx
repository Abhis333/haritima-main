"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select } from "../ui/select";
import { Label } from "../ui/label";
import { FileUploadField } from "./FileUploadField";
import { AVAILABILITY_LABEL, PLANT_TYPE_LABEL } from "@/lib/utils";

export type PlantFormValue = {
  id?: string;
  commonName: string;
  scientificName: string;
  hindiName: string | null;
  sanskritName: string | null;
  otherNames: string[];
  family: string | null;
  plantType: string;
  availability: string;
  description: string;
  descriptionHi: string | null;
  ayurvedicProperties: string | null;
  traditionalUses: string[];
  traditionalUsesHi: string[];
  plantParts: string[];
  preparation: string | null;
  cultivation: string | null;
  precautions: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  featured: boolean;
  categoryIds: string[];
};

const LIST_FIELDS = ["otherNames", "traditionalUses", "traditionalUsesHi", "plantParts"] as const;

export function PlantForm({ initial, categories }: { initial?: PlantFormValue; categories: { id: string; nameEn: string }[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const v = initial;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = Object.fromEntries(fd.entries());
    for (const k of LIST_FIELDS) body[k] = String(fd.get(k) ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
    body.featured = fd.get("featured") === "on";
    body.categoryIds = fd.getAll("categoryIds");
    const res = await fetch(v?.id ? `/api/plants/${v.id}` : "/api/plants", {
      method: v?.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const issues = (data.issues as { path: string[]; message: string }[] | undefined)?.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      return setError(issues || data.error || "Save failed.");
    }
    router.push("/admin/plants");
    router.refresh();
  }

  const text = (name: keyof PlantFormValue, label: string, required = false, extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}{required && " *"}</Label>
      <Input id={name} name={name} required={required} defaultValue={(v?.[name] as string) ?? ""} {...extra} />
    </div>
  );
  const area = (name: keyof PlantFormValue, label: string, help?: string, required = false) => {
    const val = v?.[name];
    return (
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor={name}>{label}{required && " *"}</Label>
        <Textarea id={name} name={name} required={required} rows={4} defaultValue={Array.isArray(val) ? val.join("\n") : ((val as string) ?? "")} />
        {help && <p className="text-xs text-muted-foreground">{help}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={submit} className="space-y-8">
      <fieldset className="grid gap-4 rounded-xl border border-parch bg-card p-5 md:grid-cols-2">
        <legend className="px-1 text-lg font-medium text-forest">Names</legend>
        {text("commonName", "Common name", true)}
        {text("scientificName", "Scientific name", true)}
        {text("hindiName", "Hindi name", false, { lang: "hi" })}
        {text("sanskritName", "Sanskrit name", false, { lang: "sa" })}
        {text("family", "Family")}
        {area("otherNames", "Other names / synonyms", "One per line. Include botanical synonyms so photo identification can match.")}
      </fieldset>

      <fieldset className="grid gap-4 rounded-xl border border-parch bg-card p-5 md:grid-cols-2">
        <legend className="px-1 text-lg font-medium text-forest">Classification</legend>
        <div className="space-y-1.5">
          <Label htmlFor="plantType">Plant type</Label>
          <Select id="plantType" name="plantType" defaultValue={v?.plantType ?? "OTHER"}>
            {Object.entries(PLANT_TYPE_LABEL).map(([k, l]) => <option key={k} value={k}>{l.en}</option>)}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="availability">Availability</Label>
          <Select id="availability" name="availability" defaultValue={v?.availability ?? "AVAILABLE"}>
            {Object.entries(AVAILABILITY_LABEL).map(([k, l]) => <option key={k} value={k}>{l.en}</option>)}
          </Select>
        </div>
        <div className="md:col-span-2">
          <p className="text-sm font-medium text-forest">Categories</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-2 rounded-full border border-parch px-3 py-1.5">
                <input type="checkbox" name="categoryIds" value={c.id} defaultChecked={v?.categoryIds.includes(c.id)} className="accent-forest" /> {c.nameEn}
              </label>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={v?.featured} className="h-4 w-4 accent-forest" /> Feature on home page</label>
      </fieldset>

      <fieldset className="grid gap-4 rounded-xl border border-parch bg-card p-5 md:grid-cols-2">
        <legend className="px-1 text-lg font-medium text-forest">Description & traditional knowledge</legend>
        {area("description", "Description (English)", undefined, true)}
        {area("descriptionHi", "Description (Hindi)")}
        {area("traditionalUses", "Traditional uses (English)", "One per line. State only what a documented source supports.")}
        {area("traditionalUsesHi", "Traditional uses (Hindi)", "One per line, in the same order as English.")}
        {area("plantParts", "Parts traditionally used", "One per line, e.g. Leaf, Root.")}
        {area("ayurvedicProperties", "Traditional properties (Rasa, Guna, Virya, Vipaka)")}
        {area("preparation", "Preparation (as documented)")}
        {area("cultivation", "Cultivation")}
        {area("precautions", "Precautions")}
      </fieldset>

      <fieldset className="grid gap-4 rounded-xl border border-parch bg-card p-5 md:grid-cols-2">
        <legend className="px-1 text-lg font-medium text-forest">Photo</legend>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="imageUrl">Image</Label>
          <FileUploadField id="imageUrl" name="imageUrl" kind="image" defaultValue={v?.imageUrl ?? ""} />
        </div>
        {text("imageAlt", "Image description (alt text)")}
      </fieldset>

      {error && <p role="alert" className="text-[#8a2e22]">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : v?.id ? "Save changes" : "Create plant"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
      <p className="text-sm text-muted-foreground">Add campus locations and references from their own admin pages after saving.</p>
    </form>
  );
}
