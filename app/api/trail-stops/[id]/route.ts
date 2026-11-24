import { prisma } from "@/lib/prisma";
import { adminCrud } from "@/lib/crud";
import { trailStopSchema } from "@/lib/validation";

export const { PUT, DELETE } = adminCrud("TrailStop", () => prisma.trailStop as never, trailStopSchema);
