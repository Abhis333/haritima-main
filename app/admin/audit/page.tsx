import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

export default async function AdminAudit() {
  const logs = await prisma.auditLog.findMany({ take: 200, orderBy: { createdAt: "desc" }, include: { user: { select: { email: true } } } });
  return (
    <div>
      <h1 className="text-4xl">Audit log</h1>
      <p className="mt-2 text-muted-foreground">Every admin create, update, delete, upload and role change. Latest 200 entries.</p>
      <div className="mt-6 overflow-x-auto rounded-xl border border-parch bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-parch bg-parch/40 text-forest">
            <tr><th scope="col" className="px-4 py-3 font-medium">When</th><th scope="col" className="px-4 py-3 font-medium">Who</th><th scope="col" className="px-4 py-3 font-medium">Action</th><th scope="col" className="px-4 py-3 font-medium">Entity</th><th scope="col" className="px-4 py-3 font-medium">Details</th></tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-parch/70 align-top last:border-0">
                <td className="whitespace-nowrap px-4 py-2.5">{l.createdAt.toLocaleString("en-IN")}</td>
                <td className="px-4 py-2.5">{l.user?.email ?? "system"}</td>
                <td className="px-4 py-2.5"><Badge>{l.action}</Badge></td>
                <td className="px-4 py-2.5">{l.entity}{l.entityId ? <span className="block text-xs text-muted-foreground">{l.entityId}</span> : null}</td>
                <td className="max-w-md truncate px-4 py-2.5 text-muted-foreground">{l.details ? JSON.stringify(l.details) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
