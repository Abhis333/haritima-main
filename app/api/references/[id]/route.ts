import { prisma } from "@/lib/prisma";
import { handle, requireAdmin } from "@/lib/guards";
import { referenceSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { indexPlant } from "@/lib/rag";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handle(async (req: Request, { params }: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await params;
  const data = referenceSchema.parse(await req.json());
  const before = await prisma.ayurvedicReference.findUniqueOrThrow({ where: { id } });
  const becameVerified = data.verificationStatus === "VERIFIED" && before.verificationStatus !== "VERIFIED";
  const row = await prisma.ayurvedicReference.update({
    where: { id },
    data: {
      ...data,
      ...(becameVerified ? { verifiedBy: admin.email ?? admin.id, verifiedAt: new Date() } : {}),
      ...(data.verificationStatus !== "VERIFIED" ? { verifiedBy: null, verifiedAt: null } : {}),
    },
  });
  await audit(admin.id, "UPDATE", "AyurvedicReference", id, { from: before.verificationStatus, to: row.verificationStatus });
  await indexPlant(row.plantId).catch(console.error);
  return Response.json(row);
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await params;
  const row = await prisma.ayurvedicReference.delete({ where: { id } });
  await audit(admin.id, "DELETE", "AyurvedicReference", id);
  await indexPlant(row.plantId).catch(console.error);
  return Response.json({ ok: true });
});
