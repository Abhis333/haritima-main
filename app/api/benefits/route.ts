import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/guards";
import { adminCrud } from "@/lib/crud";
import { benefitSchema } from "@/lib/validation";

export const GET = handle(async (req: Request) => {
  const plantId = new URL(req.url).searchParams.get("plantId") ?? undefined;
  return Response.json(await prisma.plantBenefit.findMany({ where: plantId ? { plantId } : undefined, orderBy: { concern: "asc" } }));
});
export const { POST } = adminCrud("PlantBenefit", () => prisma.plantBenefit as never, benefitSchema, true);
