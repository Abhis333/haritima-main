import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries";

// Validated pair (dataviz validator, light surface): CVD ΔE 16.4, normal ΔE 20.8. Rows are also labelled, so colour is never the only cue.
export const FLOWER_COLOR = "#B04A7A";
export const FRUIT_COLOR = "#B8892E";

/** Two 12-month rows (flowering, fruiting) with the active months filled. */
export function SeasonStrip({ flowering, fruiting, labels, highlight, className }: {
  flowering: number[];
  fruiting: number[];
  labels: Dictionary["seasons"];
  /** Month (1-12) to outline, e.g. the current month. */
  highlight?: number;
  className?: string;
}) {
  const rows = [
    { label: labels.flowering, months: flowering, color: FLOWER_COLOR },
    { label: labels.fruiting, months: fruiting, color: FRUIT_COLOR },
  ];
  return (
    <div className={cn("space-y-2", className)}>
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[4.5rem_1fr] items-center gap-2">
          <span className="text-xs text-muted-foreground">{r.label}</span>
          <ol className="grid grid-cols-12 gap-[2px]" aria-label={`${r.label}: ${r.months.map((m) => labels.months[m - 1]).join(", ") || "—"}`}>
            {labels.short.map((m, i) => {
              const on = r.months.includes(i + 1);
              return (
                <li
                  key={m}
                  title={on ? `${labels.months[i]} · ${r.label}` : undefined}
                  className={cn("h-3.5 rounded-[3px]", !on && "bg-muted", highlight === i + 1 && "ring-2 ring-forest ring-offset-1")}
                  style={on ? { background: r.color } : undefined}
                />
              );
            })}
          </ol>
        </div>
      ))}
      <div className="grid grid-cols-[4.5rem_1fr] gap-2" aria-hidden="true">
        <span />
        <div className="grid grid-cols-12 text-center text-[10px] text-muted-foreground">
          {labels.short.map((m) => <span key={m}>{m.slice(0, 1)}</span>)}
        </div>
      </div>
    </div>
  );
}
