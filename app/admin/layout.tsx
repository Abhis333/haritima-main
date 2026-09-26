import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side role check, in addition to middleware.
  // Role is re-read from the database so a demoted admin loses access immediately.
  const session = await auth();
  const dbUser = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
    : null;
  if (!session || dbUser?.role !== "ADMIN") redirect("/login?callbackUrl=/admin");
  return (
    <div className="min-h-screen lg:flex">
      <AdminSidebar userName={session.user.name ?? session.user.email ?? "Admin"} />
      <main id="main" className="min-w-0 flex-1 p-5 sm:p-8">{children}</main>
    </div>
  );
}
