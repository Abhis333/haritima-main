import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/guards";
import { adminCrud } from "@/lib/crud";
import { mantraSchema } from "@/lib/validation";

export const GET = handle(async (req: Request) => {
  const category = new URL(req.url).searchParams.get("category") ?? undefined;
  const rows = await prisma.mantra.findMany({
    where: { verificationStatus: { not: "REJECTED" }, ...(category ? { category } : {}) },
    orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
  });
  return Response.json(rows);
});
export const { POST } = adminCrud("Mantra", () => prisma.mantra as never, mantraSchema);
