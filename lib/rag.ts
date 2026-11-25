import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { aiEnabled, cosine, embed } from "@/lib/ai";
import { hindiFoldSql, searchPlantIds, toTsQuery } from "@/lib/search";

const INDEX_INCLUDE = {
  references: { where: { verificationStatus: "VERIFIED" as const } },
  benefits: true,
  locations: true,
} satisfies Prisma.PlantInclude;

type IndexablePlant = Prisma.PlantGetPayload<{ include: typeof INDEX_INCLUDE }>;
type Doc = { kind: string; title: string; content: string; referenceId?: string };

/** Builds the knowledge chunks for one plant. Only VERIFIED references become reference chunks. */
function buildDocs(plant: IndexablePlant): Doc[] {
  const names = [plant.commonName, plant.hindiName, plant.sanskritName, plant.scientificName, ...plant.otherNames]
    .filter(Boolean)
    .join(", ");
  return [
    {
      kind: "plant",
      title: plant.commonName,
      content: `${names}. Family: ${plant.family ?? "—"}. ${plant.description} ${plant.ayurvedicProperties ?? ""} Parts used: ${plant.plantParts.join(", ")}. Campus: ${plant.locations.map((l) => l.campusArea).join(", ")}`,
    },
    ...plant.traditionalUses.map((u, i) => ({
      kind: "use",
      title: `${plant.commonName} — traditional use`,
      content: `${names}. Traditional use: ${u} ${plant.traditionalUsesHi[i] ?? ""}`,
    })),
    ...plant.benefits.map((b) => ({
      kind: "use",
      title: `${plant.commonName} — ${b.concern}`,
      content: `${names}. Concern: ${b.concern} ${b.concernHi ?? ""}. ${b.description} Part: ${b.plantPart ?? "—"}`,
    })),
    ...plant.references.map((r) => ({
      kind: "reference",
      title: `${plant.commonName} — ${r.textName}`,
      content: `${names}. ${r.textName} ${r.chapter ?? ""} ${r.section ?? ""} ${r.verse ?? ""}. ${r.citation}`,
      referenceId: r.id,
    })),
  ];
}

/** Returns the vectors, `[]` when AI is disabled, or `null` when the embedding call failed. */
async function embedDocs(texts: string[]): Promise<number[][] | null> {
  try {
    return await embed(texts, "RETRIEVAL_DOCUMENT");
  } catch (e) {
    console.error("Embedding failed; keeping existing vectors for unchanged chunks", e);
    return null;
  }
}

/**
 * When embedding failed, reuse the stored vector of any chunk whose text is unchanged, so a transient error
 * (rate limit, timeout) does not wipe a working semantic index. Only new or edited chunks end up without a vector.
 */
async function carryForward(plantIds: string[], docs: { plantId: string; content: string }[]) {
  const existing = await prisma.knowledgeDocument.findMany({
    where: { plantId: { in: plantIds }, NOT: { embedding: { isEmpty: true } } },
    select: { plantId: true, content: true, embedding: true },
  });
  const byKey = new Map<string, number[]>(existing.map((d) => [`${d.plantId}|${d.content}`, d.embedding]));
  return docs.map((d) => byKey.get(`${d.plantId}|${d.content}`) ?? []);
}

/** Replaces a plant's chunks atomically, so a failure never leaves the plant with no chunks. */
async function writeDocs(plantId: string, docs: Doc[], vectors: number[][]) {
  await prisma.$transaction([
    prisma.knowledgeDocument.deleteMany({ where: { plantId } }),
    prisma.knowledgeDocument.createMany({
      data: docs.map((d, i) => ({ ...d, plantId, embedding: vectors[i] ?? [] })),
    }),
  ]);
}

/** Rebuilds the knowledge chunks for one plant. Embeddings are computed before the old chunks are replaced. */
export async function indexPlant(plantId: string) {
  const plant = await prisma.plant.findUnique({ where: { id: plantId }, include: INDEX_INCLUDE });
  if (!plant) {
    await prisma.knowledgeDocument.deleteMany({ where: { plantId } });
    return 0;
  }
  const docs = buildDocs(plant);
  const vectors =
    (await embedDocs(docs.map((d) => d.content))) ??
    (await carryForward([plantId], docs.map((d) => ({ plantId, content: d.content }))));
  await writeDocs(plantId, docs, vectors);
  return docs.length;
}

/** Re-indexes every plant with batched embedding calls (90 chunks per request) instead of one call per plant. */
export async function reindexAll() {
  const plants = await prisma.plant.findMany({ include: INDEX_INCLUDE });
  const perPlant = plants.map((p) => ({ id: p.id, docs: buildDocs(p) }));
  const embedded = await embedDocs(perPlant.flatMap((p) => p.docs.map((d) => d.content)));
  const vectors =
    embedded ??
    (await carryForward(
      perPlant.map((p) => p.id),
      perPlant.flatMap((p) => p.docs.map((d) => ({ plantId: p.id, content: d.content }))),
    ));
  let offset = 0;
  for (const p of perPlant) {
    await writeDocs(p.id, p.docs, vectors.slice(offset, offset + p.docs.length));
    offset += p.docs.length;
  }
  return { plants: plants.length, chunks: offset, embeddingsFailed: embedded === null };
}

/**
 * Hybrid retrieval over the verified knowledge base:
 * 1) semantic similarity on stored embeddings (when an AI key is configured)
 * 2) PostgreSQL full-text search on knowledge chunks
 * 3) direct name match on plants
 * Returns plant ids ordered by combined score. Nothing outside the database is ever returned.
 */
export async function retrievePlantIds(question: string, limit = 5): Promise<string[]> {
  const scores = new Map<string, number>();
  const bump = (id: string | null, s: number) => {
    if (id) scores.set(id, (scores.get(id) ?? 0) + s);
  };

  if (aiEnabled()) {
    try {
      const [q] = await embed([question], "RETRIEVAL_QUERY");
      if (q) {
        const docs = await prisma.knowledgeDocument.findMany({
          where: { NOT: { embedding: { isEmpty: true } } },
          select: { plantId: true, embedding: true },
        });
        const ranked = docs
          .map((d) => ({ id: d.plantId, s: cosine(q, d.embedding) }))
          .filter((d) => d.s >= Number(process.env.RAG_MIN_SIMILARITY ?? 0.6))
          .sort((a, b) => b.s - a.s)
          .slice(0, 12);
        ranked.forEach((r, i) => bump(r.id, r.s * 2 - i * 0.02));
      }
    } catch (e) {
      console.error("Vector retrieval failed", e);
    }
  }

  const tsq = toTsQuery(question);
  if (tsq) {
    // A tsquery parse error degrades to "no full-text hits" instead of failing the whole chat request.
    type Row = { plantId: string | null; rank: number };
    // Chunk text is folded like the query (normalizeHindi), so Hindi spelling variants match.
    const doc = Prisma.sql`to_tsvector('simple', ${hindiFoldSql(Prisma.sql`content`)})`;
    const rows: Row[] = await prisma
      .$queryRaw<Row[]>(Prisma.sql`
      SELECT "plantId", ts_rank(${doc}, to_tsquery('simple', ${tsq}))::float AS rank
      FROM "KnowledgeDocument"
      WHERE ${doc} @@ to_tsquery('simple', ${tsq})
      ORDER BY rank DESC LIMIT 20`)
      .catch((e: unknown): Row[] => {
        console.error("Knowledge full-text search failed", e);
        return [];
      });
    rows.forEach((r) => bump(r.plantId, 0.5 + Math.min(r.rank, 1)));
  }

  const byName = await searchPlantIds(question).catch(() => []);
  byName.slice(0, 5).forEach((id, i) => bump(id, 0.8 - i * 0.1));

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}
