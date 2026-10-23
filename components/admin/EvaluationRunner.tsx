"use client";

import { useMemo, useRef, useState } from "react";
import { Download, Loader2, Play, Square } from "lucide-react";
import type { EvalCase, EvalMode, EvalResult } from "@/lib/eval";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { cn } from "@/lib/utils";

type Outcome = EvalResult | { id: string; error: string };

const pct = (n: number) => `${Math.round(n * 100)}%`;
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const isResult = (o: Outcome | undefined): o is EvalResult => Boolean(o && "pass" in o);

function p95(xs: number[]) {
  if (!xs.length) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted[Math.ceil(0.95 * sorted.length) - 1];
}

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export function EvaluationRunner({ cases, plantNames, aiEnabled }: { cases: EvalCase[]; plantNames: Record<string, string>; aiEnabled: boolean }) {
  const [mode, setMode] = useState<EvalMode>(aiEnabled ? "full" : "retrieval");
  const [results, setResults] = useState<Record<string, Outcome>>({});
  const [running, setRunning] = useState(false);
  const [runMode, setRunMode] = useState<EvalMode | null>(null);
  const stop = useRef(false);

  const name = (slug: string) => plantNames[slug] ?? slug;

  async function run() {
    stop.current = false;
    setResults({});
    setRunning(true);
    setRunMode(mode);
    // Sequential on purpose: keeps latency figures honest and stays within AI rate limits.
    for (const c of cases) {
      if (stop.current) break;
      let outcome: Outcome;
      try {
        const res = await fetch("/api/knowledge/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caseId: c.id, mode }),
        });
        const data = await res.json().catch(() => ({}));
        outcome = res.ok ? (data as EvalResult) : { id: c.id, error: data.error ?? `HTTP ${res.status}` };
      } catch {
        outcome = { id: c.id, error: "Network error" };
      }
      setResults((r) => ({ ...r, [c.id]: outcome }));
    }
    setRunning(false);
  }

  const summary = useMemo(() => {
    const done = cases.filter((c) => results[c.id]);
    const ok = done.map((c) => ({ c, r: results[c.id] })).filter((x): x is { c: EvalCase; r: EvalResult } => isResult(x.r));
    const plantCases = ok.filter((x) => x.c.kind === "plants");
    const groups = new Map<string, { pass: number; total: number }>();
    for (const { c, r } of ok) {
      const g = groups.get(c.group) ?? { pass: 0, total: 0 };
      g.total++;
      if (r.pass) g.pass++;
      groups.set(c.group, g);
    }
    const latencies = ok.map((x) => x.r.latencyMs);
    return {
      done: done.length,
      errors: done.length - ok.length,
      passed: ok.filter((x) => x.r.pass).length,
      scored: ok.length,
      hitRate: mean(plantCases.map((x) => (x.r.pass ? 1 : 0))),
      top1: mean(plantCases.map((x) => (x.r.top1 ? 1 : 0))),
      precision: mean(plantCases.map((x) => x.r.precision ?? 0)),
      recall: mean(plantCases.map((x) => x.r.recall ?? 0)),
      noMatchRate: mean(plantCases.map((x) => (x.r.returned.length === 0 ? 1 : 0))),
      plantCases: plantCases.length,
      avgLatency: Math.round(mean(latencies)),
      p95Latency: p95(latencies),
      // Answers where the LLM should have run but the retrieval-only fallback was used instead.
      llmFallbacks: ok.filter((x) => !x.r.llmUsed && !x.r.urgent && x.r.returned.length > 0).length,
      groups: [...groups.entries()],
    };
  }, [cases, results]);

  function exportCsv() {
    const header = ["id", "group", "language", "question", "expected", "returned", "result", "precision", "recall", "top1", "latency_ms", "llm_used", "note"];
    const lines = cases.map((c) => {
      const r = results[c.id];
      const base = [c.id, c.group, c.lang, c.question, c.expected.map(name).join("; ")];
      if (!r) return [...base, "", "not run"];
      if (!isResult(r)) return [...base, "", "error", "", "", "", "", "", r.error];
      return [
        ...base,
        r.returned.map(name).join("; "),
        r.pass ? "pass" : "fail",
        r.precision?.toFixed(2) ?? "",
        r.recall?.toFixed(2) ?? "",
        r.top1 === null ? "" : r.top1 ? "yes" : "no",
        r.latencyMs,
        r.llmUsed ? "yes" : "no",
        r.note ?? "",
      ];
    });
    // The BOM lets Excel read the Hindi questions correctly.
    const csv = "﻿" + [header, ...lines].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `haritima-chatbot-evaluation-${runMode ?? mode}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tiles: [string, string][] = [
    ["Passed", `${summary.passed} / ${summary.scored}`],
    ["Hit rate", pct(summary.hitRate)],
    ["Top-1 correct", pct(summary.top1)],
    ["Precision", pct(summary.precision)],
    ["Recall", pct(summary.recall)],
    ["Wrong no-match", pct(summary.noMatchRate)],
    ["Avg latency", `${summary.avgLatency} ms`],
    ["p95 latency", `${summary.p95Latency} ms`],
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-parch bg-card p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="eval-mode">Mode</Label>
            <Select id="eval-mode" className="w-72" value={mode} disabled={running} onChange={(e) => setMode(e.target.value as EvalMode)}>
              <option value="full">Full chatbot (retrieval + AI answer)</option>
              <option value="retrieval">Retrieval only (top 5, no AI call)</option>
            </Select>
          </div>
          {running ? (
            <Button variant="outline" onClick={() => (stop.current = true)}><Square /> Stop</Button>
          ) : (
            <Button onClick={run}><Play /> Run {cases.length} questions</Button>
          )}
          <Button variant="outline" disabled={running || summary.done === 0} onClick={exportCsv}><Download /> Download CSV</Button>
          {running && (
            <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> {summary.done} of {cases.length} done
            </p>
          )}
        </div>
        {mode === "full" && !aiEnabled && (
          <p className="mt-3 text-sm text-muted-foreground">No AI key is set, so “full” mode answers in retrieval-only mode.</p>
        )}

        {summary.done > 0 && (
          <>
            <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {tiles.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-parch/70 px-4 py-3">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="deva text-2xl text-forest">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-sm text-muted-foreground">
              Hit rate, top-1, precision, recall and wrong no-match are measured over the {summary.plantCases} questions that expect plants.
              {summary.errors > 0 && ` ${summary.errors} request(s) failed and are not scored.`}
              {runMode === "full" && aiEnabled && summary.llmFallbacks > 0 &&
                ` ${summary.llmFallbacks} answer(s) fell back to retrieval-only mode because the AI call failed (often a rate limit); rerun for clean figures.`}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {summary.groups.map(([group, g]) => (
                <Badge key={group} variant={g.pass === g.total ? "verified" : "pending"}>{group}: {g.pass}/{g.total}</Badge>
              ))}
            </div>
          </>
        )}
      </section>

      <div className="overflow-x-auto rounded-xl border border-parch bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-parch bg-parch/40 text-forest">
            <tr>
              {["#", "Question", "Expected", "Returned", "Result", "P / R", "Time"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => {
              const r = results[c.id];
              const expected = new Set(c.expected);
              return (
                <tr key={c.id} className="border-b border-parch/70 align-top last:border-0">
                  <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{c.id}</td>
                  <td className="max-w-xs px-4 py-2.5">
                    <span className={c.lang === "hi" ? "deva" : undefined}>{c.question}</span>
                    <span className="block text-xs text-muted-foreground">{c.group}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    {c.kind === "plants" ? c.expected.map(name).join(", ") : c.kind === "noMatch" ? "No plants" : c.kind === "urgent" ? "Emergency message" : "Not an emergency"}
                  </td>
                  <td className="px-4 py-2.5">
                    {!r ? "—" : !isResult(r) ? <span className="text-[#8a2e22]">{r.error}</span> : r.urgent ? "Emergency message" : r.returned.length === 0 ? "No match" : (
                      r.returned.map((s, i) => (
                        <span key={s}>{i > 0 && ", "}<span className={cn(expected.has(s) && "font-semibold text-forest")}>{name(s)}</span></span>
                      ))
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {isResult(r) && (
                      <>
                        <Badge variant={r.pass ? "verified" : "rejected"}>{r.pass ? "Pass" : "Fail"}</Badge>
                        {r.note && <span className="mt-1 block text-xs text-muted-foreground">{r.note}</span>}
                      </>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    {isResult(r) && r.precision !== null ? `${pct(r.precision)} / ${pct(r.recall ?? 0)}` : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{isResult(r) ? `${r.latencyMs} ms` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
