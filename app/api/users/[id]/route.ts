import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, HttpError, requireAdmin } from "@/lib/guards";
import { audit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await params;
  const { role } = z.object({ role: z.enum(["USER", "ADMIN"]) }).parse(await req.json());
  if (id === admin.id && role !== "ADMIN") throw new HttpError(400, "You can’t remove your own admin role.");
  const user = await prisma.$transaction(async (tx) => {
    // Lock every admin row so two concurrent demotions are serialised and can't leave zero admins.
    const admins = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "User" WHERE role = 'ADMIN' FOR UPDATE`;
    const targetIsAdmin = admins.some((a) => a.id === id);
    if (role === "USER" && targetIsAdmin && admins.length <= 1) throw new HttpError(400, "At least one admin must remain.");
    return tx.user.update({ where: { id }, data: { role }, select: { id: true, role: true } });
  });
  await audit(admin.id, "ROLE_CHANGE", "User", id, { role });
  return Response.json(user);
});
