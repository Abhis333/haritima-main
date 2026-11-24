import { prisma } from "@/lib/prisma";
import { adminCrud } from "@/lib/crud";
import { trailStopSchema } from "@/lib/validation";

// Stops are read through their trail (lib/trails.ts), so only the admin write is exposed here.
export const { POST } = adminCrud("TrailStop", () => prisma.trailStop as never, trailStopSchema);
