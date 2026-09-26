import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { getMapPoints } from "@/lib/map-data";
import { PlantMapLoader } from "@/components/PlantMapLoader";

export const metadata: Metadata = { title: "Campus plant map", description: "Interactive map of plants on the Dev Sanskriti Vishwavidyalaya campus." };

export default async function MapPage({ searchParams }: { searchParams: Promise<{ plant?: string }> }) {
  const { t, lang } = await getDictionary();
  const [points, { plant }] = await Promise.all([getMapPoints(lang), searchParams]);
  const areas = [...new Set(points.map((p) => p.campusArea))];
  return (
    <div className="container-h py-10">
      <h1 className="text-5xl">{t.map.title}</h1>
      <p className="mt-3 prose-h">{t.map.sub} {t.home.mapSub.split(". ").slice(1).join(". ")}</p>
      <div className="mt-8">
        {points.length ? (
          <PlantMapLoader points={points} focusSlug={plant} height="min(72vh, 720px)" />
        ) : (
          <p className="rounded-xl border border-dashed border-moss/60 p-12 text-center text-muted-foreground">No plant locations recorded yet. Add coordinates in Admin → Plant locations.</p>
        )}
      </div>
      {areas.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl">{t.plants.area}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map((a) => (
              <li key={a} className="rounded-lg border border-parch bg-card p-4">
                <p className="font-medium text-forest">{a}</p>
                <p className="text-sm text-muted-foreground">{points.filter((p) => p.campusArea === a).map((p) => p.commonName).join(", ")}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
