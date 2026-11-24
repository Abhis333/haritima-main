import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/guards";
import { adminCrud } from "@/lib/crud";
import { trailSchema } from "@/lib/validation";

export const GET = handle(async () => {
  const rows = await prisma.trail.findMany({
    where: { published: true },
    include: { _count: { select: { stops: true } } },
    orderBy: { title: "asc" },
  });
  return Response.json(rows);
});

export const { POST } = adminCrud("Trail", () => prisma.trail as never, trailSchema);
