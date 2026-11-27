import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { getCampusPlaces, getMapPoints } from "@/lib/map-data";
import { PlantMapLoader } from "@/components/PlantMapLoader";

export const metadata: Metadata = { title: "Campus plant map", description: "Interactive map of plants on the Dev Sanskriti Vishwavidyalaya campus." };

export default async function MapPage({ searchParams }: { searchParams: Promise<{ plant?: string; guide?: string }> }) {
  const { t, lang } = await getDictionary();
  const [points, places, { plant, guide }] = await Promise.all([getMapPoints(lang), getCampusPlaces(lang), searchParams]);
  const areas = [...new Set(points.map((p) => p.campusArea))];
  return (
    <div className="container-h py-10">
      <h1 className="text-4xl">{t.map.title}</h1>
      <p className="mt-3 prose-h">{t.map.sub} {t.home.mapSub.split(". ").slice(1).join(". ")}</p>
      {points.length > 0 && (
        <dl className="mt-6 flex gap-8 border-y border-border py-3 text-sm">
          <div className="flex items-baseline gap-2">
            <dt className="sr-only">{t.map.plantsLabel}</dt>
            <dd className="text-xl font-semibold tabular-nums text-forest">{new Set(points.map((p) => p.slug)).size}</dd>
            <span className="text-muted-foreground" aria-hidden="true">{t.map.plantsLabel}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="sr-only">{t.map.areasLabel}</dt>
            <dd className="text-xl font-semibold tabular-nums text-forest">{areas.length}</dd>
            <span className="text-muted-foreground" aria-hidden="true">{t.map.areasLabel}</span>
          </div>
        </dl>
      )}
      <div className="mt-6">
        {points.length ? (
          <PlantMapLoader points={points} places={places} focusSlug={plant} autoGuide={guide === "1"} height="min(72vh, 720px)" />
        ) : (
          <p className="rounded-xl border border-dashed border-moss/60 p-12 text-center text-muted-foreground">No plant locations recorded yet. Add coordinates in Admin → Plant locations.</p>
        )}
      </div>
      {areas.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl">{t.plants.area}</h2>
          <ul className="mt-4 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {areas.map((a) => {
              const names = [...new Set(points.filter((p) => p.campusArea === a).map((p) => p.commonName))];
              return (
                <li key={a} className="bg-card p-4">
                  <p className="flex items-baseline justify-between gap-3 font-medium text-forest">
                    {a} <span className="text-xs font-normal tabular-nums text-muted-foreground">{names.length}</span>
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{names.join(", ")}</p>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
