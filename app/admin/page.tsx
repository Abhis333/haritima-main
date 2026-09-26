import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboard() {
  const [plants, locations, verified, pending, mantras, users, openFeedback, chats, docs, logs, noLocation] = await Promise.all([
    prisma.plant.count(),
    prisma.plantLocation.count(),
    prisma.ayurvedicReference.count({ where: { verificationStatus: "VERIFIED" } }),
    prisma.ayurvedicReference.count({ where: { verificationStatus: "PENDING" } }),
    prisma.mantra.count(),
    prisma.user.count(),
    prisma.feedback.count({ where: { resolved: false } }),
    prisma.chatMessage.count({ where: { role: "user" } }),
    prisma.knowledgeDocument.count(),
    prisma.auditLog.findMany({ take: 8, orderBy: { createdAt: "desc" }, include: { user: { select: { email: true } } } }),
    prisma.plant.findMany({ where: { locations: { none: {} } }, select: { id: true, commonName: true }, take: 10 }),
  ]);

  const cards = [
    { label: "Plants", n: plants, href: "/admin/plants" },
    { label: "Campus locations", n: locations, href: "/admin/locations" },
    { label: "Verified references", n: verified, href: "/admin/references" },
    { label: "References pending", n: pending, href: "/admin/references", warn: pending > 0 },
    { label: "Mantras", n: mantras, href: "/admin/mantras" },
    { label: "Users", n: users, href: "/admin/users" },
    { label: "Open feedback", n: openFeedback, href: "/admin/feedback", warn: openFeedback > 0 },
    { label: "Chat questions (signed-in)", n: chats, href: "/admin/knowledge" },
    { label: "Knowledge chunks", n: docs, href: "/admin/knowledge" },
  ];

  return (
    <div>
      <h1 className="text-4xl">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-xl border border-parch bg-card p-5 hover:border-forest/40">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className={`deva mt-1 text-4xl ${c.warn ? "text-[#7a5a14]" : "text-forest"}`}>{c.n}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-8 xl:grid-cols-2">
        <section>
          <h2 className="text-2xl">Plants without a campus location</h2>
          {noLocation.length === 0 ? <p className="mt-3 text-muted-foreground">Every plant has at least one location.</p> : (
            <ul className="mt-3 space-y-1">{noLocation.map((p) => <li key={p.id}><Link className="text-leaf underline" href="/admin/locations">{p.commonName}</Link></li>)}</ul>
          )}
        </section>
        <section>
          <h2 className="text-2xl">Recent admin activity</h2>
          <ul className="mt-3 divide-y divide-parch rounded-xl border border-parch bg-card">
            {logs.length === 0 && <li className="p-4 text-muted-foreground">No activity yet.</li>}
            {logs.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-sm">
                <Badge>{l.action}</Badge> {l.entity} <span className="text-muted-foreground">by {l.user?.email ?? "system"} · {l.createdAt.toLocaleString("en-IN")}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
