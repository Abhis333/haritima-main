import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, requireAdmin } from "@/lib/guards";
import { audit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await params;
  const { resolved } = z.object({ resolved: z.boolean() }).parse(await req.json());
  const row = await prisma.feedback.update({ where: { id }, data: { resolved } });
  await audit(admin.id, "UPDATE", "Feedback", id, { resolved });
  return Response.json(row);
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await params;
  await prisma.feedback.delete({ where: { id } });
  await audit(admin.id, "DELETE", "Feedback", id);
  return Response.json({ ok: true });
});
