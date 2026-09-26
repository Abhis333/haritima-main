import { prisma } from "@/lib/prisma";
import { adminCrud } from "@/lib/crud";
import { categorySchema } from "@/lib/validation";

export const { PUT, DELETE } = adminCrud("PlantCategory", () => prisma.plantCategory as never, categorySchema);
