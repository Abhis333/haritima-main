import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/guards";
import { adminCrud } from "@/lib/crud";
import { locationSchema } from "@/lib/validation";

export const GET = handle(async (req: Request) => {
  const plantId = new URL(req.url).searchParams.get("plantId") ?? undefined;
  const rows = await prisma.plantLocation.findMany({
    where: plantId ? { plantId } : undefined,
    include: { plant: { select: { slug: true, commonName: true, scientificName: true, hindiName: true } } },
    orderBy: { campusArea: "asc" },
  });
  return Response.json(rows);
});

export const { POST } = adminCrud("PlantLocation", () => prisma.plantLocation as never, locationSchema, true);
