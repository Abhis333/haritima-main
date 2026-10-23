import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SOURCE_TYPE_LABEL } from "@/lib/utils";
import { PrintButton } from "@/components/admin/SmallActions";

export const metadata = { title: "Reference verification sheet" };

// A blank line to write on; shows the stored value (if any) in grey so the reviewer can confirm or correct it.
function Blank({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 min-h-7 border-b border-dashed border-ink/40 pb-0.5 text-sm text-muted-foreground">{value || " "}</p>
    </div>
  );
}

function Tick({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span aria-hidden className="inline-block h-4 w-4 rounded-sm border border-ink/60" /> {label}
    </span>
  );
}

export default async function ReferenceVerificationSheet({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const all = status === "all";
  const refs = await prisma.ayurvedicReference.findMany({
    where: all ? undefined : { verificationStatus: "PENDING" },
    include: {
      plant: { select: { commonName: true, scientificName: true, sanskritName: true, hindiName: true } },
      benefits: { select: { concern: true, description: true, plantPart: true } },
    },
    orderBy: [{ plant: { commonName: "asc" } }, { createdAt: "asc" }],
  });
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-4xl print:max-w-none">
      <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
        <PrintButton label="Print sheet" />
        <Link href={all ? "/admin/references/print" : "/admin/references/print?status=all"} className="text-sm text-forest underline">
          {all ? "Show pending references only" : "Include verified and rejected references"}
        </Link>
        <Link href="/admin/references" className="text-sm text-forest underline">Back to references</Link>
      </div>

      <header className="border-b border-parch pb-4">
        <h1 className="text-3xl">हरिtima: Ayurvedic reference verification sheet</h1>
        <p className="mt-1 text-sm text-muted-foreground">Dev Sanskriti Vishwavidyalaya, Haridwar · Printed {today} · {refs.length} reference{refs.length === 1 ? "" : "s"}</p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
          <li>For each entry, open the original text (or an official publication) and locate the passage about this plant.</li>
          <li>Write the exact edition, chapter/section, verse and page. Grey text is what is currently stored; correct it if wrong.</li>
          <li>Check that the passage supports each listed traditional association. Tick one outcome, then sign and date.</li>
          <li>The admin enters the confirmed details in Admin → Ayurvedic references and marks the entry VERIFIED or REJECTED.</li>
        </ol>
      </header>

      {refs.length === 0 && <p className="mt-8 text-muted-foreground">No references to verify.</p>}

      {refs.map((r, i) => (
        <section key={r.id} className="mt-6 break-inside-avoid rounded-xl border border-parch bg-card p-5 print:rounded-none print:border-ink/30">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl">
              {i + 1}. {r.plant.commonName} <em className="text-base font-normal">({r.plant.scientificName})</em>
            </h2>
            <span className="text-xs text-muted-foreground">Ref ID {r.id.slice(-8)} · {r.verificationStatus}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {[r.plant.sanskritName && `Sanskrit: ${r.plant.sanskritName}`, r.plant.hindiName && `Hindi: ${r.plant.hindiName}`, SOURCE_TYPE_LABEL[r.sourceType]].filter(Boolean).join(" · ")}
          </p>

          <div className="mt-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Associations this reference should support</p>
            {r.benefits.length ? (
              <ul className="mt-1 list-disc pl-5 text-sm">
                {r.benefits.map((b, j) => <li key={j}><strong>{b.concern}</strong>{b.plantPart ? ` (${b.plantPart})` : ""}: {b.description}</li>)}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">None linked.</p>
            )}
          </div>

          <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Blank label="Text name" value={r.textName} wide />
            <Blank label="Author / editor, edition, publisher, year" value={r.author} wide />
            <Blank label="Chapter" value={r.chapter} />
            <Blank label="Section (Sthana / Varga)" value={r.section} />
            <Blank label="Verse / shloka no." value={r.verse} />
            <Blank label="Page no." />
            <Blank label="Remarks" wide />
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <Tick label="Verified as written" />
            <Tick label="Verified with corrections above" />
            <Tick label="Passage not found / reject" />
          </div>

          <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-4">
            <Blank label="Verified by (name)" />
            <Blank label="Designation / department" />
            <Blank label="Signature" />
            <Blank label="Date" />
          </div>
        </section>
      ))}
    </div>
  );
}
