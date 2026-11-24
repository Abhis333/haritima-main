import { cn } from "@/lib/utils";

// Single-series charts for the admin analytics page. One hue; values are always printed in ink, never in the series colour.
export const SERIES_COLOR = "#2F6B4F";

/** Headline number with a short label and optional context line. */
export function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-forest">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Daily column chart: bars anchored to a baseline with 2px gaps; hover shows the day and value; a table view sits underneath. */
export function DailyBars({ title, data, unit }: { title: string; data: { day: string; label: string; value: number }[]; unit: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <figure className="rounded-lg border border-border bg-card p-5">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="font-medium text-forest">{title}</span>
        <span className="text-sm tabular-nums text-muted-foreground">{total} {unit}</span>
      </figcaption>
      <div className="mt-4 grid grid-cols-[2rem_1fr] gap-2">
        <div className="flex h-40 flex-col justify-between text-right text-[11px] tabular-nums text-muted-foreground" aria-hidden="true">
          <span>{max}</span>
          <span>0</span>
        </div>
        <div className="relative h-40 border-b border-ink/30">
          <div className="absolute inset-x-0 top-0 border-t border-dashed border-border" aria-hidden="true" />
          <ol className="flex h-full items-end gap-[2px]" aria-label={title}>
            {data.map((d) => (
              <li key={d.day} className="group relative flex h-full flex-1 items-end" title={`${d.label}: ${d.value} ${unit}`}>
                <span
                  className="w-full rounded-t-[4px] transition-opacity group-hover:opacity-80"
                  style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 2 : 0, background: SERIES_COLOR }}
                />
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-[11px] text-white group-hover:block">
                  {d.label}: <b>{d.value}</b>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <span />
        <div className="flex justify-between text-[11px] text-muted-foreground" aria-hidden="true">
          <span>{data[0]?.label}</span>
          <span>{data.at(-1)?.label}</span>
        </div>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted-foreground">Show as table</summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <thead><tr className="text-muted-foreground"><th className="font-normal">Day</th><th className="text-right font-normal">{unit}</th></tr></thead>
          <tbody>{data.map((d) => <tr key={d.day} className="border-t border-border"><td className="py-1">{d.label}</td><td className="text-right">{d.value}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  );
}

/** Ranked horizontal bars with the name and value as text. */
export function RankedBars({ title, rows, empty, className }: { title: string; rows: { label: React.ReactNode; key: string; value: number }[]; empty: string; className?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className={cn("rounded-lg border border-border bg-card p-5", className)}>
      <h2 className="font-medium text-forest">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ol className="mt-3 space-y-2.5">
          {rows.map((r) => (
            <li key={r.key} className="grid grid-cols-[minmax(0,9rem)_1fr_2.5rem] items-center gap-3 text-sm">
              <span className="truncate">{r.label}</span>
              <span className="h-2.5 rounded-r-[4px]" style={{ width: `${(r.value / max) * 100}%`, minWidth: 2, background: SERIES_COLOR }} aria-hidden="true" />
              <span className="text-right tabular-nums text-ink">{r.value}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
