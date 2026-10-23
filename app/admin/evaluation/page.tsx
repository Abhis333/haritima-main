import { prisma } from "@/lib/prisma";
import { aiEnabled } from "@/lib/ai";
import { EVAL_CASES } from "@/lib/eval";
import { EvaluationRunner } from "@/components/admin/EvaluationRunner";

export default async function AdminEvaluation() {
  const [plants, withVectors] = await Promise.all([
    prisma.plant.findMany({ select: { slug: true, commonName: true } }),
    prisma.knowledgeDocument.count({ where: { NOT: { embedding: { isEmpty: true } } } }),
  ]);
  const plantNames = Object.fromEntries(plants.map((p) => [p.slug, p.commonName]));
  const missing = [...new Set(EVAL_CASES.flatMap((c) => c.expected))].filter((slug) => !(slug in plantNames));
  const ai = aiEnabled();

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-parch bg-card p-6">
        <h1 className="text-4xl">Chatbot evaluation</h1>
        <p className="mt-3 max-w-3xl text-[0.95rem]">
          Runs a fixed set of {EVAL_CASES.length} test questions through Ask Haritima and checks each answer: the right plants for a concern,
          no plants for out-of-scope questions, emergency wording detected, and no doses or citations in the answer text.
          Run it after changing plant data, synonyms or retrieval settings, and download the CSV for the project report.
        </p>
        <dl className="mt-5 flex flex-wrap gap-8">
          <div><dt className="text-sm text-muted-foreground">Test questions</dt><dd className="deva text-3xl text-forest">{EVAL_CASES.length}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Chunks with embeddings</dt><dd className="deva text-3xl text-forest">{withVectors}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Retrieval mode</dt><dd className="text-lg text-forest">{ai ? "Semantic + full-text" : "Full-text only (no AI key)"}</dd></div>
        </dl>
        {missing.length > 0 && (
          <p role="alert" className="mt-4 text-[#8a2e22]">
            Expected plants missing from the database: {missing.join(", ")}. Questions expecting them will fail until the plants exist or the test set in <code>lib/eval.ts</code> is updated.
          </p>
        )}
        {ai && withVectors === 0 && (
          <p role="alert" className="mt-4 text-[#8a2e22]">No chunks have embeddings yet. Rebuild the knowledge base first, or semantic retrieval will not be tested.</p>
        )}
      </section>
      <EvaluationRunner cases={EVAL_CASES} plantNames={plantNames} aiEnabled={ai} />
    </div>
  );
}
