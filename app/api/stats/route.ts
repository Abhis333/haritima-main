import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/guards";

export const GET = handle(async () => {
  const [plants, medicinal, locations, verifiedReferences] = await Promise.all([
    prisma.plant.count(),
    prisma.plant.count({ where: { categories: { some: { slug: { in: ["medicinal", "ayurvedic"] } } } } }),
    prisma.plantLocation.count(),
    prisma.ayurvedicReference.count({ where: { verificationStatus: "VERIFIED" } }),
  ]);
  return Response.json({ plants, medicinal, locations, verifiedReferences }, { headers: { "Cache-Control": "public, s-maxage=120" } });
});
