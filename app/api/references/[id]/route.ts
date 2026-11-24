import { prisma } from "@/lib/prisma";
import { handle, requireAdmin } from "@/lib/guards";
import { referenceSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { indexPlant } from "@/lib/rag";

type Ctx = { params: Promise<{ id: string }> };

/** Fields a reviewer checks against the source text. Changing any of them invalidates an existing verification. */
const CITATION_FIELDS = ["plantId", "textName", "author", "chapter", "section", "verse", "citation", "referenceUrl", "sourceType"] as const;

export const PUT = handle(async (req: Request, { params }: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await params;
  const data = referenceSchema.parse(await req.json());
  const before = await prisma.ayurvedicReference.findUniqueOrThrow({ where: { id } });
  const changed = CITATION_FIELDS.filter((f) => (before[f] ?? null) !== (data[f] ?? null));
  const becameVerified = data.verificationStatus === "VERIFIED" && before.verificationStatus !== "VERIFIED";
  // An already-verified reference whose citation was edited goes back to PENDING: the new values have not been checked.
  const needsReverification = before.verificationStatus === "VERIFIED" && data.verificationStatus === "VERIFIED" && changed.length > 0;
  const status = needsReverification ? "PENDING" : data.verificationStatus;
  const row = await prisma.ayurvedicReference.update({
    where: { id },
    data: {
      ...data,
      verificationStatus: status,
      ...(becameVerified ? { verifiedBy: admin.email ?? admin.id, verifiedAt: new Date() } : {}),
      ...(status !== "VERIFIED" ? { verifiedBy: null, verifiedAt: null } : {}),
    },
  });
  await audit(admin.id, "UPDATE", "AyurvedicReference", id, {
    from: before.verificationStatus,
    to: row.verificationStatus,
    changed,
    ...(needsReverification ? { resetToPending: true } : {}),
  });
  // Re-index the new plant and, if the reference moved, the old one too.
  await Promise.all([...new Set([before.plantId, row.plantId])].map((pid) => indexPlant(pid).catch(console.error)));
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
