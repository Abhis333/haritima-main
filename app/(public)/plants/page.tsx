import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/i18n/server";
import { findPlants } from "@/lib/search";
import { plantQuerySchema } from "@/lib/validation";
import { PlantCard } from "@/components/PlantCard";
import { PlantFilters } from "@/components/PlantFilters";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Explore plants", description: "Search the plants of the DSVV campus by name, category, campus area or traditional use." };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function PlantsPage({ searchParams }: { searchParams: SP }) {
  const { t, lang } = await getDictionary();
  const raw = Object.fromEntries(Object.entries(await searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const query = plantQuerySchema.parse(raw);

  const [result, categories, areas, concerns] = await Promise.all([
    findPlants(query),
    prisma.plantCategory.findMany({ orderBy: { nameEn: "asc" } }),
    prisma.plantLocation.findMany({ distinct: ["campusArea"], select: { campusArea: true }, orderBy: { campusArea: "asc" } }),
    prisma.plantBenefit.findMany({ distinct: ["concern"], select: { concern: true, concernHi: true }, orderBy: { concern: "asc" } }),
  ]);
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const pageHref = (p: number) => {
    const sp = new URLSearchParams(raw as Record<string, string>);
    sp.set("page", String(p));
    return `/plants?${sp.toString()}`;
  };

  return (
    <div className="container-h py-12">
      <h1 className="text-5xl">{t.plants.title}</h1>
      <p className="mt-3 prose-h">{t.plants.sub}</p>

      <div className="mt-8">
        <Suspense>
          <PlantFilters
            categories={categories.map((c) => ({ value: c.slug, label: lang === "hi" ? c.nameHi : c.nameEn }))}
            areas={areas.map((a) => a.campusArea)}
            uses={concerns.map((c) => ({ value: c.concern, label: lang === "hi" && c.concernHi ? c.concernHi : c.concern }))}
          />
        </Suspense>
      </div>

      <p className="mt-8 text-sm text-muted-foreground" aria-live="polite">
        {result.total} {t.plants.results}
      </p>

      {result.items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-moss/60 p-12 text-center">
          <p className="text-xl text-forest">{t.plants.none}</p>
          <p className="mt-2 text-muted-foreground">{t.plants.noneHint}</p>
          <Button asChild variant="outline" className="mt-5"><Link href="/plants">{t.plants.clear}</Link></Button>
        </div>
      ) : (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((p) => <PlantCard key={p.id} plant={p} lang={lang} viewLabel={t.plants.view} />)}
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Pagination">
          {query.page > 1 && <Button asChild variant="outline" size="sm"><Link href={pageHref(query.page - 1)}>{t.plants.prev}</Link></Button>}
          <span className="text-sm text-muted-foreground">{query.page} / {pages}</span>
          {query.page < pages && <Button asChild variant="outline" size="sm"><Link href={pageHref(query.page + 1)}>{t.plants.next}</Link></Button>}
        </nav>
      )}
    </div>
  );
}
