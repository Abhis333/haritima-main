import { handle, requireAdmin } from "@/lib/guards";
import { reindexAll } from "@/lib/rag";
import { audit } from "@/lib/audit";

export const maxDuration = 60;

export const POST = handle(async () => {
  const admin = await requireAdmin();
  const result = await reindexAll();
  await audit(admin.id, "REINDEX", "KnowledgeDocument", undefined, result);
  return Response.json(result);
});
