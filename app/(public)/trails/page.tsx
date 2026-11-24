import Link from "next/link";
import type { Metadata } from "next";
import { Footprints } from "lucide-react";
import { getDictionary } from "@/lib/i18n/server";
import { getTrails } from "@/lib/trails";

export const metadata: Metadata = { title: "Campus walking trails", description: "Guided walks through the plants of the Dev Sanskriti Vishwavidyalaya campus." };

export default async function TrailsPage() {
  const { t, lang } = await getDictionary();
  const trails = await getTrails(lang);
  return (
    <div className="container-h py-10">
      <h1 className="text-4xl">{t.trails.title}</h1>
      <p className="mt-3 prose-h">{t.trails.sub}</p>
      {trails.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">{t.trails.none}</p>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {trails.map((tr) => (
            <li key={tr.slug}>
              <Link href={`/trails/${tr.slug}`} className="group flex h-full flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-leaf/60">
                <span className="h-1 w-12 rounded-full" style={{ background: tr.color }} aria-hidden="true" />
                <h2 className="mt-3 text-2xl group-hover:underline">{tr.title}</h2>
                <p className="mt-2 flex-1 text-[0.97rem] text-ink/80">{tr.description}</p>
                <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Footprints className="h-4 w-4 text-leaf" aria-hidden="true" />
                  {tr.stops.length} {t.trails.stops} · {tr.km} {t.trails.km} · ~{tr.minutes} {t.trails.walk}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
