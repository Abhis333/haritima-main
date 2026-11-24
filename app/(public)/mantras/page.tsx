import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/i18n/server";
import { MantraCard } from "@/components/MantraAnimation";
import { cn } from "@/lib/utils";
import { PUBLIC_MANTRA_WHERE } from "@/lib/public-select";

export const metadata: Metadata = { title: "Vedic mantras & wisdom", description: "Vedic mantras on nature, peace and knowledge with Hindi and English translations." };

const CATEGORIES = ["Nature", "Peace", "Health", "Environment", "Knowledge", "Well-being"];

export default async function MantrasPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { t } = await getDictionary();
  const { category } = await searchParams;
  const active = category && CATEGORIES.includes(category) ? category : undefined;
  const mantras = await prisma.mantra.findMany({
    where: { ...PUBLIC_MANTRA_WHERE, ...(active ? { category: active } : {}) },
    orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
  });
  const labels = { source: t.mantras.source, hindi: t.mantras.hindi, english: t.mantras.english, meaning: t.mantras.meaning, listen: t.mantras.listen, pending: t.plant.pending };

  return (
    <div className="container-h py-10">
      <h1 className="text-5xl">{t.mantras.title}</h1>
      <p className="mt-3 prose-h">{t.mantras.sub}</p>
      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Mantra categories">
        {[undefined, ...CATEGORIES].map((c) => (
          <Link
            key={c ?? "all"}
            href={c ? `/mantras?category=${encodeURIComponent(c)}` : "/mantras"}
            aria-current={active === c ? "page" : undefined}
            className={cn("rounded-full border px-3.5 py-1.5 text-sm", active === c ? "border-forest bg-forest text-sandal" : "border-parch bg-card hover:border-forest/40")}
          >
            {c ?? t.mantras.all}
          </Link>
        ))}
      </nav>
      <div className="mt-8 space-y-8">
        {mantras.length === 0 && <p className="rounded-xl border border-dashed border-moss/60 p-10 text-center text-muted-foreground">No mantras in this category yet.</p>}
        {mantras.map((m, i) => <MantraCard key={m.id} mantra={m} labels={labels} large={i === 0} />)}
      </div>
    </div>
  );
}
