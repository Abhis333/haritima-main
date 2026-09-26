import { prisma } from "@/lib/prisma";
import { adminCrud } from "@/lib/crud";
import { locationSchema } from "@/lib/validation";

export const { PUT, DELETE } = adminCrud("PlantLocation", () => prisma.plantLocation as never, locationSchema, true);
