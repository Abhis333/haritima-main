import { prisma } from "@/lib/prisma";
import { aiEnabled } from "@/lib/ai";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { ReindexButton } from "@/components/admin/SmallActions";

export default async function AdminKnowledge() {
  const [docs, withVectors, benefits, plants, refs] = await Promise.all([
    prisma.knowledgeDocument.count(),
    prisma.knowledgeDocument.count({ where: { NOT: { embedding: { isEmpty: true } } } }),
    prisma.plantBenefit.findMany({ include: { plant: { select: { commonName: true } }, reference: { select: { textName: true, verificationStatus: true } } }, orderBy: [{ concern: "asc" }] }),
    prisma.plant.findMany({ select: { id: true, commonName: true }, orderBy: { commonName: "asc" } }),
    prisma.ayurvedicReference.findMany({ where: { verificationStatus: "VERIFIED" }, select: { id: true, textName: true, plant: { select: { commonName: true } } } }),
  ]);
  return (
    <div className="space-y-10">
      <section className="rounded-xl border border-parch bg-card p-6">
        <h1 className="text-4xl">Chatbot knowledge base</h1>
        <p className="mt-3 max-w-3xl text-[0.95rem]">
          Ask Haritima retrieves only from these chunks, which are built from plant records, traditional-use entries and <strong>verified</strong> references.
          Chunks rebuild automatically when you save a plant, benefit or reference; rebuild everything after bulk imports.
        </p>
        <dl className="mt-5 flex flex-wrap gap-8">
          <div><dt className="text-sm text-muted-foreground">Chunks</dt><dd className="deva text-3xl text-forest">{docs}</dd></div>
          <div><dt className="text-sm text-muted-foreground">With embeddings</dt><dd className="deva text-3xl text-forest">{withVectors}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Retrieval mode</dt><dd className="text-lg text-forest">{aiEnabled() ? "Semantic + full-text" : "Full-text only (no AI key)"}</dd></div>
        </dl>
        <div className="mt-5"><ReindexButton /></div>
      </section>

      <ResourceManager
        title="Traditional associations"
        endpoint="/api/benefits"
        rows={benefits}
        searchKeys={["plant.commonName", "concern", "description"]}
        columns={[
          { key: "plant.commonName", label: "Plant" },
          { key: "concern", label: "Concern keyword" },
          { key: "description", label: "Association" },
          { key: "reference.textName", label: "Reference" },
          { key: "reference.verificationStatus", label: "Ref. status", badge: true },
        ]}
        fields={[
          { name: "plantId", label: "Plant", type: "select", required: true, options: plants.map((p) => ({ value: p.id, label: p.commonName })) },
          { name: "concern", label: "Concern keyword (English)", type: "text", required: true, help: "Short and lowercase: sleep, digestion, cough, skin…" },
          { name: "concernHi", label: "Concern (Hindi)", type: "text" },
          { name: "plantPart", label: "Plant part", type: "text" },
          { name: "referenceId", label: "Supporting verified reference", type: "select", options: refs.map((r) => ({ value: r.id, label: `${r.plant.commonName} — ${r.textName}` })) },
          { name: "description", label: "Traditional association, as documented", type: "textarea", required: true },
        ]}
      />
    </div>
  );
}
