import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DailyBars, RankedBars, StatTile } from "@/components/admin/Charts";

const RANGES = [7, 30, 90] as const;
const DAY_MS = 86_400_000;

/** UTC day keys (YYYY-MM-DD) for the last `days` days, oldest first. Views are stored per UTC day, so chat logs use the same buckets. */
function dayKeys(days: number) {
  const today = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());
  return Array.from({ length: days }, (_, i) => new Date(today - (days - 1 - i) * DAY_MS).toISOString().slice(0, 10));
}
const shortDate = (key: string) => new Date(`${key}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

function countBy<T>(items: T[], key: (t: T) => string) {
  const m = new Map<string, number>();
  for (const it of items) m.set(key(it), (m.get(key(it)) ?? 0) + 1);
  return m;
}

export default async function AdminAnalytics({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const requested = Number((await searchParams).days);
  const days = (RANGES as readonly number[]).includes(requested) ? requested : 30;
  const keys = dayKeys(days);
  const since = new Date(`${keys[0]}T00:00:00Z`);

  const [views, queries, plants, concerns] = await Promise.all([
    prisma.plantViewDaily.findMany({ where: { day: { gte: since } }, select: { plantId: true, day: true, count: true } }),
    prisma.chatQueryLog.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 10_000 }),
    prisma.plant.findMany({ select: { id: true, slug: true, commonName: true } }),
    prisma.plantBenefit.findMany({ distinct: ["concern"], select: { concern: true, concernHi: true } }),
  ]);
  const byId = new Map(plants.map((p) => [p.id, p]));
  const bySlug = new Map(plants.map((p) => [p.slug, p]));
  const plantLink = (p: { slug: string; commonName: string } | undefined, fallback: string) =>
    p ? <Link href={`/plants/${p.slug}`} className="text-leaf hover:underline">{p.commonName}</Link> : fallback;

  // Plant views
  const viewsPerDay = new Map<string, number>();
  const viewsPerPlant = new Map<string, number>();
  for (const v of views) {
    const k = v.day.toISOString().slice(0, 10);
    viewsPerDay.set(k, (viewsPerDay.get(k) ?? 0) + v.count);
    viewsPerPlant.set(v.plantId, (viewsPerPlant.get(v.plantId) ?? 0) + v.count);
  }
  const totalViews = [...viewsPerDay.values()].reduce((a, b) => a + b, 0);
  const topViewed = [...viewsPerPlant.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Chatbot questions
  const questionsPerDay = countBy(queries, (q) => q.createdAt.toISOString().slice(0, 10));
  const urgent = queries.filter((q) => q.urgent).length;
  const unanswered = queries.filter((q) => !q.urgent && q.plantSlugs.length === 0);
  const answerable = queries.length - urgent;
  const answeredRate = answerable ? Math.round(((answerable - unanswered.length) / answerable) * 100) : null;
  const hindi = queries.filter((q) => q.lang === "hi").length;
  const latencies = queries.map((q) => q.latencyMs).sort((a, b) => a - b);
  const medianLatency = latencies.length ? latencies[Math.floor(latencies.length / 2)] : null;
  const recommended = countBy(queries.flatMap((q) => q.plantSlugs), (s) => s);
  const topRecommended = [...recommended.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const topics = concerns
    .map((c) => ({
      concern: c.concern,
      n: queries.filter((q) => {
        const text = q.question.toLowerCase();
        return text.includes(c.concern) || (c.concernHi ? text.includes(c.concernHi) : false);
      }).length,
    }))
    .filter((t) => t.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 10);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Analytics</h1>
        <nav aria-label="Time range" className="flex gap-1">
          {RANGES.map((r) => (
            <Link key={r} href={`/admin/analytics?days=${r}`} aria-current={r === days ? "true" : undefined}
              className={`rounded-md border px-3 py-1.5 text-sm ${r === days ? "border-forest bg-forest text-sandal" : "border-border bg-card hover:bg-muted"}`}>
              Last {r} days
            </Link>
          ))}
        </nav>
      </div>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Plant views are counted once per plant per browser session. Every chatbot question is logged without any user id or IP address. Days are UTC.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Plant page views" value={totalViews} sub={`${viewsPerPlant.size} plants viewed`} />
        <StatTile label="Chatbot questions" value={queries.length} sub={queries.length ? `${Math.round((hindi / queries.length) * 100)}% asked in Hindi` : undefined} />
        <StatTile label="Answered with a plant" value={answeredRate === null ? "—" : `${answeredRate}%`} sub={`${unanswered.length} unanswered · ${urgent} urgent-safety replies`} />
        <StatTile label="Median answer time" value={medianLatency === null ? "—" : `${(medianLatency / 1000).toFixed(1)} s`} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <DailyBars title="Plant page views per day" unit="views" data={keys.map((k) => ({ day: k, label: shortDate(k), value: viewsPerDay.get(k) ?? 0 }))} />
        <DailyBars title="Chatbot questions per day" unit="questions" data={keys.map((k) => ({ day: k, label: shortDate(k), value: questionsPerDay.get(k) ?? 0 }))} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <RankedBars title="Most viewed plants" empty="No plant views yet."
          rows={topViewed.map(([id, n]) => ({ key: id, label: plantLink(byId.get(id), "Deleted plant"), value: n }))} />
        <RankedBars title="Plants the chatbot recommends most" empty="No chatbot answers yet."
          rows={topRecommended.map(([slug, n]) => ({ key: slug, label: plantLink(bySlug.get(slug), slug), value: n }))} />
        <RankedBars title="Most asked-about concerns" empty="No questions matched a known concern yet."
          rows={topics.map((t) => ({ key: t.concern, label: t.concern, value: t.n }))} />
      </div>

      <section className="mt-6 rounded-lg border border-border bg-card p-5">
        <h2 className="font-medium text-forest">Questions with no matching plant</h2>
        <p className="mt-1 text-sm text-muted-foreground">Content gaps: consider adding plants, benefits or synonyms for these. Urgent-safety questions are excluded.</p>
        {unanswered.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">None in this period.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead><tr className="text-muted-foreground"><th className="py-1 font-normal">Question</th><th className="font-normal">Lang</th><th className="text-right font-normal">When</th></tr></thead>
            <tbody>
              {unanswered.slice(0, 20).map((q) => (
                <tr key={q.id} className="border-t border-border">
                  <td className="py-1.5 pr-3">{q.question}</td>
                  <td className="uppercase text-muted-foreground">{q.lang}</td>
                  <td className="whitespace-nowrap text-right text-muted-foreground">{q.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
