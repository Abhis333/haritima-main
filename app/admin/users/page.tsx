import { prisma } from "@/lib/prisma";
import { RoleSelect } from "@/components/admin/SmallActions";

export default async function AdminUsers() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { conversations: true } } }, orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="text-4xl">Users</h1>
      <div className="mt-6 overflow-x-auto rounded-xl border border-parch bg-card">
        <table className="w-full text-left text-[0.95rem]">
          <thead className="border-b border-parch bg-parch/40 text-sm text-forest">
            <tr><th scope="col" className="px-4 py-3 font-medium">Name</th><th scope="col" className="px-4 py-3 font-medium">Email</th><th scope="col" className="px-4 py-3 font-medium">Conversations</th><th scope="col" className="px-4 py-3 font-medium">Joined</th><th scope="col" className="px-4 py-3 font-medium">Role</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-parch/70 last:border-0">
                <td className="px-4 py-3">{u.name ?? "—"}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u._count.conversations}</td>
                <td className="px-4 py-3 text-sm">{u.createdAt.toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-2"><RoleSelect id={u.id} role={u.role} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
