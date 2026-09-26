import { prisma } from "@/lib/prisma";
import { handle, HttpError, requireAdmin } from "@/lib/guards";
import { plantSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { indexPlant } from "@/lib/rag";
import { PUBLIC_REFERENCE_SELECT } from "@/lib/public-select";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  const plant = await prisma.plant.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      categories: true,
      locations: true,
      benefits: true,
      // Public fields only: never expose verifiedBy (admin email) or reviewer notes.
      references: { where: { verificationStatus: { not: "REJECTED" } }, select: PUBLIC_REFERENCE_SELECT },
    },
  });
  if (!plant) throw new HttpError(404, "Plant not found");
  return Response.json(plant);
});

export const PUT = handle(async (req: Request, { params }: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await params;
  const { categoryIds, ...data } = plantSchema.parse(await req.json());
  const plant = await prisma.plant.update({
    where: { id },
    data: { ...data, categories: { set: categoryIds.map((cid) => ({ id: cid })) } },
  });
  await audit(admin.id, "UPDATE", "Plant", id, { commonName: plant.commonName });
  // Awaited so serverless platforms don't freeze the function mid-index.
  await indexPlant(id).catch(console.error);
  return Response.json(plant);
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await params;
  const plant = await prisma.plant.delete({ where: { id } });
  await audit(admin.id, "DELETE", "Plant", id, { commonName: plant.commonName });
  return Response.json({ ok: true });
});
