import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { handle, requireAdmin } from "@/lib/guards";
import { referenceSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { indexPlant } from "@/lib/rag";
import { PUBLIC_REFERENCE_SELECT } from "@/lib/public-select";

// Public: verified references only. Admins may pass ?all=1 to see pending/rejected ones.
export const GET = handle(async (req: Request) => {
  const url = new URL(req.url);
  const plantId = url.searchParams.get("plantId") ?? undefined;
  const session = await auth();
  const all = url.searchParams.get("all") === "1" && session?.user.role === "ADMIN";
  const plant = { select: { commonName: true, slug: true } };
  // Admins (all=1) get full rows; the public never sees verifiedBy (admin email) or reviewer notes.
  const rows = all
    ? await prisma.ayurvedicReference.findMany({
        where: plantId ? { plantId } : {},
        include: { plant },
        orderBy: { createdAt: "desc" },
      })
    : await prisma.ayurvedicReference.findMany({
        where: { ...(plantId ? { plantId } : {}), verificationStatus: "VERIFIED" },
        select: { ...PUBLIC_REFERENCE_SELECT, plant },
        orderBy: { createdAt: "desc" },
      });
  return Response.json(rows);
});

export const POST = handle(async (req: Request) => {
  const admin = await requireAdmin();
  const data = referenceSchema.parse(await req.json());
  const verified = data.verificationStatus === "VERIFIED";
  const row = await prisma.ayurvedicReference.create({
    data: { ...data, verifiedBy: verified ? admin.email ?? admin.id : null, verifiedAt: verified ? new Date() : null },
  });
  await audit(admin.id, "CREATE", "AyurvedicReference", row.id, { status: row.verificationStatus });
  await indexPlant(row.plantId).catch(console.error);
  return Response.json(row, { status: 201 });
});
