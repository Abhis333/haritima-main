import { prisma } from "@/lib/prisma";
import { adminCrud } from "@/lib/crud";
import { benefitSchema } from "@/lib/validation";

export const { PUT, DELETE } = adminCrud("PlantBenefit", () => prisma.plantBenefit as never, benefitSchema, true);
