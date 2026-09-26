import { prisma } from "@/lib/prisma";
import { handle, requireAdmin } from "@/lib/guards";

export const GET = handle(async () => {
  await requireAdmin();
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { conversations: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(users);
});
