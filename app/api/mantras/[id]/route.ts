import { prisma } from "@/lib/prisma";
import { adminCrud } from "@/lib/crud";
import { mantraSchema } from "@/lib/validation";

export const { PUT, DELETE } = adminCrud("Mantra", () => prisma.mantra as never, mantraSchema);
