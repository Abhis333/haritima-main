import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/guards";
import { adminCrud } from "@/lib/crud";
import { mantraSchema } from "@/lib/validation";
import { PUBLIC_MANTRA_WHERE } from "@/lib/public-select";

export const GET = handle(async (req: Request) => {
  const category = new URL(req.url).searchParams.get("category") ?? undefined;
  const rows = await prisma.mantra.findMany({
    where: { ...PUBLIC_MANTRA_WHERE, ...(category ? { category } : {}) },
    orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
  });
  return Response.json(rows);
});
export const { POST } = adminCrud("Mantra", () => prisma.mantra as never, mantraSchema);
