import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/guards";
import { adminCrud } from "@/lib/crud";
import { categorySchema } from "@/lib/validation";

export const GET = handle(async () =>
  Response.json(await prisma.plantCategory.findMany({ include: { _count: { select: { plants: true } } }, orderBy: { nameEn: "asc" } })),
);
export const { POST } = adminCrud("PlantCategory", () => prisma.plantCategory as never, categorySchema);
