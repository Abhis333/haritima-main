"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { Button } from "./ui/button";
import { useLang } from "@/lib/i18n/client";
import { AVAILABILITY_LABEL, PLANT_TYPE_LABEL } from "@/lib/utils";

type Option = { value: string; label: string };

export function PlantFilters({ categories, areas, uses }: { categories: Option[]; areas: string[]; uses: Option[] }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  // Debounced search-as-you-type
  useEffect(() => {
    const id = setTimeout(() => {
      if ((params.get("q") ?? "") !== q) update("q", q.trim());
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const hasFilters = ["q", "category", "type", "area", "availability", "use"].some((k) => params.get(k));

  return (
    <div className="space-y-4" aria-busy={pending}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <label htmlFor="plant-search" className="sr-only">{t.plants.search}</label>
        <Input
          id="plant-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.plants.searchPh}
          className="h-14 rounded-full pl-12 text-lg"
          maxLength={100}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <FilterSelect label={t.plants.category} value={params.get("category") ?? ""} onChange={(v) => update("category", v)} options={categories} all={t.plants.all} />
        <FilterSelect label={t.plants.use} value={params.get("use") ?? ""} onChange={(v) => update("use", v)} options={uses} all={t.plants.all} />
        <FilterSelect
          label={t.plants.type}
          value={params.get("type") ?? ""}
          onChange={(v) => update("type", v)}
          options={Object.entries(PLANT_TYPE_LABEL).map(([value, l]) => ({ value, label: l[lang] }))}
          all={t.plants.all}
        />
        <FilterSelect label={t.plants.area} value={params.get("area") ?? ""} onChange={(v) => update("area", v)} options={areas.map((a) => ({ value: a, label: a }))} all={t.plants.all} />
        <FilterSelect
          label={t.plants.availability}
          value={params.get("availability") ?? ""}
          onChange={(v) => update("availability", v)}
          options={Object.entries(AVAILABILITY_LABEL).map(([value, l]) => ({ value, label: l[lang] }))}
          all={t.plants.all}
        />
      </div>
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQ("");
            start(() => router.replace(pathname, { scroll: false }));
          }}
        >
          <X /> {t.plants.clear}
        </Button>
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, all }: { label: string; value: string; onChange: (v: string) => void; options: Option[]; all: string }) {
  const id = `f-${label.replace(/\W+/g, "-")}`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-muted-foreground">{label}</label>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{all}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>
    </div>
  );
}
