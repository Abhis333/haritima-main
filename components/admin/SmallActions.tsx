"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Printer, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Select } from "../ui/select";

export function DeleteButton({ endpoint, label = "Delete" }: { endpoint: string; label?: string }) {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive"
      onClick={async () => {
        if (!confirm("Delete this record? This can’t be undone.")) return;
        const res = await fetch(endpoint, { method: "DELETE" });
        if (!res.ok) alert((await res.json().catch(() => ({}))).error ?? "Delete failed.");
        router.refresh();
      }}
    >
      <Trash2 /> {label}
    </Button>
  );
}

export function RoleSelect({ id, role }: { id: string; role: string }) {
  const router = useRouter();
  return (
    <Select
      aria-label="Role"
      defaultValue={role}
      className="h-9 w-32"
      onChange={async (e) => {
        const res = await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: e.target.value }) });
        if (!res.ok) alert((await res.json().catch(() => ({}))).error ?? "Role change failed.");
        router.refresh();
      }}
    >
      <option value="USER">USER</option>
      <option value="ADMIN">ADMIN</option>
    </Select>
  );
}

export function ResolveToggle({ id, resolved }: { id: string; resolved: boolean }) {
  const router = useRouter();
  return (
    <Button
      size="sm"
      variant={resolved ? "outline" : "default"}
      onClick={async () => {
        await fetch(`/api/feedback/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resolved: !resolved }) });
        router.refresh();
      }}
    >
      {resolved ? "Reopen" : "Mark resolved"}
    </Button>
  );
}

export function ReindexButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setMsg(null);
          const res = await fetch("/api/knowledge/reindex", { method: "POST" });
          const data = await res.json().catch(() => ({}));
          setBusy(false);
          setMsg(res.ok ? `Rebuilt ${data.chunks} chunks from ${data.plants} plants.` : data.error ?? "Rebuild failed.");
          router.refresh();
        }}
      >
        {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />} Rebuild knowledge base
      </Button>
      {msg && <p role="status" className="text-sm text-muted-foreground">{msg}</p>}
    </div>
  );
}

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <Button className="print:hidden" onClick={() => window.print()}>
      <Printer /> {label}
    </Button>
  );
}
