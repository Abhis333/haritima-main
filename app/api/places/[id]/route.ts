import { prisma } from "@/lib/prisma";
import { adminCrud } from "@/lib/crud";
import { placeSchema } from "@/lib/validation";

export const { PUT, DELETE } = adminCrud("CampusPlace", () => prisma.campusPlace as never, placeSchema);
