"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select } from "../ui/select";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { FileUploadField } from "./FileUploadField";

export type Field = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "checkbox" | "url" | "audio" | "color";
  options?: { value: string; label: string }[];
  required?: boolean;
  help?: string;
  step?: string;
  full?: boolean;
};
export type Column = { key: string; label: string; badge?: boolean };
type Row = Record<string, unknown> & { id: string };

const get = (row: Row, path: string) => path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | null)?.[k], row);

export function ResourceManager({ title, endpoint, fields, columns, rows, defaults = {}, searchKeys = [] }: {
  title: string;
  endpoint: string;
  fields: Field[];
  columns: Column[];
  rows: Row[];
  defaults?: Record<string, unknown>;
  searchKeys?: string[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");

  const visible = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return rows;
    return rows.filter((r) => searchKeys.some((k) => String(get(r, k) ?? "").toLowerCase().includes(f)));
  }, [rows, filter, searchKeys]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    for (const f of fields) {
      if (f.type === "checkbox") body[f.name] = fd.get(f.name) === "on";
      else if (f.type === "number") body[f.name] = fd.get(f.name) === "" ? null : Number(fd.get(f.name));
      else body[f.name] = (fd.get(f.name) as string | null) ?? "";
    }
    const isNew = editing === "new";
    const res = await fetch(isNew ? endpoint : `${endpoint}/${(editing as Row).id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const issues = (data.issues as { path: string[]; message: string }[] | undefined)?.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      return setError(issues || data.error || "Save failed.");
    }
    setEditing(null);
    router.refresh();
  }

  async function remove(row: Row) {
    if (!confirm("Delete this record? This can’t be undone.")) return;
    const res = await fetch(`${endpoint}/${row.id}`, { method: "DELETE" });
    if (!res.ok) alert((await res.json().catch(() => ({}))).error ?? "Delete failed.");
    router.refresh();
  }

  const current = editing && editing !== "new" ? editing : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">{title}</h1>
        <Button onClick={() => { setError(null); setEditing("new"); }}><Plus /> Add</Button>
      </div>

      {editing && (
        <form onSubmit={save} className="mt-6 rounded-xl border border-parch bg-card p-5" key={current?.id ?? "new"}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl">{current ? "Edit record" : "New record"}</h2>
            <Button type="button" variant="ghost" size="icon" onClick={() => setEditing(null)} aria-label="Close form"><X /></Button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {fields.map((f) => {
              const value = current ? get(current, f.name) : defaults[f.name];
              const id = `field-${f.name}`;
              return (
                <div key={f.name} className={f.type === "textarea" || f.full ? "md:col-span-2" : undefined}>
                  {f.type === "checkbox" ? (
                    <label className="flex items-center gap-2 pt-6"><input type="checkbox" name={f.name} defaultChecked={Boolean(value)} className="h-4 w-4 accent-forest" /> {f.label}</label>
                  ) : (
                    <div className="space-y-1.5">
                      <Label htmlFor={id}>{f.label}{f.required && " *"}</Label>
                      {f.type === "textarea" ? (
                        <Textarea id={id} name={f.name} required={f.required} defaultValue={(value as string) ?? ""} rows={4} />
                      ) : f.type === "select" ? (
                        <Select id={id} name={f.name} required={f.required} defaultValue={(value as string) ?? ""}>
                          {!f.required && <option value="">—</option>}
                          {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </Select>
                      ) : f.type === "audio" ? (
                        <FileUploadField id={id} name={f.name} kind="audio" defaultValue={(value as string) ?? ""} />
                      ) : (
                        <Input id={id} name={f.name} type={f.type === "url" ? "url" : f.type === "color" ? "text" : f.type} step={f.step} required={f.required} defaultValue={value == null ? "" : String(value)} />
                      )}
                      {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {error && <p role="alert" className="mt-4 text-[#8a2e22]">{error}</p>}
          <div className="mt-5 flex gap-2">
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </form>
      )}

      {searchKeys.length > 0 && (
        <Input className="mt-6 max-w-sm" placeholder="Filter…" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter records" />
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-parch bg-card">
        <table className="w-full text-left text-[0.95rem]">
          <thead className="border-b border-parch bg-parch/40 text-sm text-forest">
            <tr>
              {columns.map((c) => <th key={c.key} scope="col" className="px-4 py-3 font-medium">{c.label}</th>)}
              <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="px-4 py-10 text-center text-muted-foreground">No records yet. Use “Add” to create the first one.</td></tr>
            )}
            {visible.map((r) => (
              <tr key={r.id} className="border-b border-parch/70 last:border-0">
                {columns.map((c) => {
                  const v = get(r, c.key);
                  return (
                    <td key={c.key} className="max-w-xs truncate px-4 py-3">
                      {c.badge ? <Badge variant={v === "VERIFIED" ? "verified" : v === "PENDING" ? "pending" : v === "REJECTED" ? "rejected" : "default"}>{String(v)}</Badge> : typeof v === "boolean" ? (v ? "Yes" : "No") : String(v ?? "—")}
                    </td>
                  );
                })}
                <td className="whitespace-nowrap px-4 py-2 text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setError(null); setEditing(r); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label="Edit"><Pencil /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(r)} aria-label="Delete" className="text-destructive"><Trash2 /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
