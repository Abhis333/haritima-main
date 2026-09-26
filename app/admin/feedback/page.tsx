import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { DeleteButton, ResolveToggle } from "@/components/admin/SmallActions";

export default async function AdminFeedback() {
  const rows = await prisma.feedback.findMany({ orderBy: [{ resolved: "asc" }, { createdAt: "desc" }], take: 200 });
  return (
    <div>
      <h1 className="text-4xl">Feedback</h1>
      <div className="mt-6 space-y-3">
        {rows.length === 0 && <p className="text-muted-foreground">No feedback yet.</p>}
        {rows.map((f) => (
          <article key={f.id} className="rounded-xl border border-parch bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl">{f.subject}</h2>
              <Badge variant={f.resolved ? "verified" : "pending"}>{f.resolved ? "Resolved" : "Open"}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{f.name} · <a className="underline" href={`mailto:${f.email}`}>{f.email}</a> · {f.createdAt.toLocaleString("en-IN")}</p>
            <p className="mt-3 whitespace-pre-line">{f.message}</p>
            <div className="mt-4 flex gap-2"><ResolveToggle id={f.id} resolved={f.resolved} /><DeleteButton endpoint={`/api/feedback/${f.id}`} /></div>
          </article>
        ))}
      </div>
    </div>
  );
}
