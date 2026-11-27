import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/guards";
import { adminCrud } from "@/lib/crud";
import { placeSchema } from "@/lib/validation";

export const GET = handle(async () => Response.json(await prisma.campusPlace.findMany({ orderBy: [{ kind: "asc" }, { name: "asc" }] })));

// Places are not plant data, so they are not part of the chatbot knowledge base (no re-index).
export const { POST } = adminCrud("CampusPlace", () => prisma.campusPlace as never, placeSchema);
