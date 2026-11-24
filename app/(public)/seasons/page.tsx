import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/i18n/server";
import { FLOWER_COLOR, FRUIT_COLOR, SeasonStrip } from "@/components/SeasonStrip";

export const metadata: Metadata = { title: "Seasonal calendar", description: "Which plants flower and fruit on the Dev Sanskriti Vishwavidyalaya campus each month." };
// The highlighted month depends on today's date.
export const dynamic = "force-dynamic";

/** Current month (1-12) in India, regardless of the server's time zone. */
function currentMonth() {
  return Number(new Intl.DateTimeFormat("en-IN", { month: "numeric", timeZone: "Asia/Kolkata" }).format(new Date()));
}

export default async function SeasonsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { t, lang } = await getDictionary();
  const requested = Number((await searchParams).month);
  const month = requested >= 1 && requested <= 12 ? requested : currentMonth();

  const plants = await prisma.plant.findMany({
    where: { OR: [{ floweringMonths: { isEmpty: false } }, { fruitingMonths: { isEmpty: false } }] },
    select: { slug: true, commonName: true, hindiName: true, scientificName: true, floweringMonths: true, fruitingMonths: true },
    orderBy: { commonName: "asc" },
  });
  const name = (p: (typeof plants)[number]) => (lang === "hi" && p.hindiName ? p.hindiName : p.commonName);
  const flowering = plants.filter((p) => p.floweringMonths.includes(month));
  const fruiting = plants.filter((p) => p.fruitingMonths.includes(month));

  return (
    <div className="container-h py-10">
      <h1 className="text-4xl">{t.seasons.title}</h1>
      <p className="mt-3 prose-h">{t.seasons.sub}</p>

      <nav aria-label={t.seasons.calendar} className="mt-6 flex flex-wrap gap-1.5">
        {t.seasons.months.map((m, i) => (
          <Link
            key={m}
            href={`/seasons?month=${i + 1}`}
            aria-current={month === i + 1 ? "true" : undefined}
            className={`rounded-md border px-3 py-1.5 text-sm ${month === i + 1 ? "border-forest bg-forest text-sandal" : "border-border bg-card hover:bg-muted"}`}
          >
            {t.seasons.short[i]}
          </Link>
        ))}
      </nav>

      <section className="mt-8">
        <h2 className="text-2xl">
          {month === currentMonth() ? `${t.seasons.thisMonth}: ` : ""}{t.seasons.months[month - 1]}
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {([[t.seasons.flowering, flowering, FLOWER_COLOR], [t.seasons.fruiting, fruiting, FRUIT_COLOR]] as const).map(([label, list, color]) => (
            <div key={label} className="rounded-lg border border-border bg-card p-5">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-forest">
                <span className="h-3 w-3 rounded-sm" style={{ background: color }} aria-hidden="true" /> {label}
                <span className="ml-auto text-sm font-normal tabular-nums text-muted-foreground">{list.length}</span>
              </h3>
              {list.length ? (
                <ul className="mt-3 divide-y divide-border">
                  {list.map((p) => (
                    <li key={p.slug} className="py-2">
                      <Link href={`/plants/${p.slug}`} className="font-medium text-forest hover:underline">{name(p)}</Link>{" "}
                      <span className="sci text-sm text-muted-foreground">{p.scientificName}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-muted-foreground">{t.seasons.nothing}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {plants.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl">{t.seasons.calendar}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.seasons.note}</p>
          <ul className="mt-4 grid gap-x-8 gap-y-5 md:grid-cols-2">
            {plants.map((p) => (
              <li key={p.slug}>
                <Link href={`/plants/${p.slug}`} className="font-medium text-forest hover:underline">{name(p)}</Link>
                <SeasonStrip flowering={p.floweringMonths} fruiting={p.fruitingMonths} labels={t.seasons} highlight={month} className="mt-2" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
