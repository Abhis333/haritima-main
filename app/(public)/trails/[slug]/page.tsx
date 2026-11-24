import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Footprints } from "lucide-react";
import { getDictionary } from "@/lib/i18n/server";
import { getTrail } from "@/lib/trails";
import { TrailMapLoader } from "@/components/TrailMapLoader";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const trail = await getTrail((await params).slug, "en");
  return trail ? { title: trail.title, description: trail.description.slice(0, 160) } : { title: "Trail not found" };
}

export default async function TrailPage({ params }: { params: Params }) {
  const { t, lang } = await getDictionary();
  const trail = await getTrail((await params).slug, lang);
  if (!trail) notFound();
  const approximate = trail.stops.some((s) => s.isApproximate);

  return (
    <div className="container-h py-10">
      <Link href="/trails" className="inline-flex items-center gap-1 text-sm text-leaf hover:underline"><ArrowLeft className="h-4 w-4" /> {t.trails.all}</Link>
      <h1 className="mt-4 text-4xl">{trail.title}</h1>
      <p className="mt-3 prose-h">{trail.description}</p>
      <p className="mt-4 flex items-center gap-2 border-y border-border py-3 text-sm text-muted-foreground">
        <Footprints className="h-4 w-4 text-leaf" aria-hidden="true" />
        <span className="font-medium text-forest">{trail.stops.length}</span> {t.trails.stops} ·
        <span className="font-medium text-forest">{trail.km}</span> {t.trails.km} ·
        ~<span className="font-medium text-forest">{trail.minutes}</span> {t.trails.walk}
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <TrailMapLoader stops={trail.stops} color={trail.color} height="min(65vh, 620px)" />
          {approximate && <p className="mt-2 text-xs text-muted-foreground">{t.trails.approximate}</p>}
        </div>
        <ol className="space-y-0">
          {trail.stops.map((s, i) => (
            <li key={s.id} className="relative grid grid-cols-[2rem_1fr] gap-3 pb-5 last:pb-0">
              {i < trail.stops.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 bg-border" aria-hidden="true" />}
              <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ background: trail.color }}>{i + 1}</span>
              <div>
                <Link href={`/plants/${s.slug}`} className="font-medium text-forest hover:underline">{s.name}</Link>{" "}
                <span className="sci text-sm text-muted-foreground">{s.scientificName}</span>
                <p className="text-xs text-muted-foreground">{s.campusArea}</p>
                {s.note && <p className="mt-1 text-[0.95rem] text-ink/85">{s.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
