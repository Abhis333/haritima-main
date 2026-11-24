import { prisma } from "@/lib/prisma";
import { adminCrud } from "@/lib/crud";
import { trailSchema } from "@/lib/validation";

export const { PUT, DELETE } = adminCrud("Trail", () => prisma.trail as never, trailSchema);
