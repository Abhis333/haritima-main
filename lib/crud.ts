import type { ZodTypeAny, z } from "zod";
import { handle, requireAdmin } from "@/lib/guards";
import { audit } from "@/lib/audit";
import { indexPlant } from "@/lib/rag";

type Delegate = {
  create(args: { data: unknown }): Promise<{ id: string; plantId?: string | null }>;
  update(args: { where: { id: string }; data: unknown }): Promise<{ id: string; plantId?: string | null }>;
  delete(args: { where: { id: string } }): Promise<{ id: string; plantId?: string | null }>;
};

/**
 * Admin-only create/update/delete handlers with validation, audit logging and,
 * for plant-linked records, re-indexing of the RAG knowledge base.
 */
export function adminCrud<S extends ZodTypeAny>(entity: string, delegate: () => Delegate, schema: S, reindex = false) {
  const after = async (row: { plantId?: string | null }) => {
    if (reindex && row.plantId) await indexPlant(row.plantId).catch(console.error);
  };
  return {
    POST: handle(async (req: Request) => {
      const admin = await requireAdmin();
      const data: z.infer<S> = schema.parse(await req.json());
      const row = await delegate().create({ data });
      await audit(admin.id, "CREATE", entity, row.id);
      await after(row);
      return Response.json(row, { status: 201 });
    }),
    PUT: handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
      const admin = await requireAdmin();
      const { id } = await params;
      const data: z.infer<S> = schema.parse(await req.json());
      const row = await delegate().update({ where: { id }, data });
      await audit(admin.id, "UPDATE", entity, id, data as never);
      await after(row);
      return Response.json(row);
    }),
    DELETE: handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
      const admin = await requireAdmin();
      const { id } = await params;
      const row = await delegate().delete({ where: { id } });
      await audit(admin.id, "DELETE", entity, id);
      await after(row);
      return Response.json({ ok: true });
    }),
  };
}
