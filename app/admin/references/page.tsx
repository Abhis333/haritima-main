import Link from "next/link";
import { Printer } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { SOURCE_TYPE_LABEL } from "@/lib/utils";

export default async function AdminReferences() {
  const [rows, plants] = await Promise.all([
    prisma.ayurvedicReference.findMany({ include: { plant: { select: { commonName: true } } }, orderBy: [{ verificationStatus: "asc" }, { createdAt: "desc" }] }),
    prisma.plant.findMany({ select: { id: true, commonName: true }, orderBy: { commonName: "asc" } }),
  ]);
  return (
    <>
      <div className="mb-6 max-w-3xl rounded-lg border-l-4 border-haldi bg-[#f3e8cf] px-4 py-3 text-[0.95rem]">
        Mark a reference <strong>VERIFIED</strong> only after checking the text, chapter/section and verse against the original source or an official publication.
        Only verified references are shown as authoritative and cited by Ask Haritima. Never fill in a chapter or verse you haven’t confirmed.
        <Link href="/admin/references/print" className="mt-2 flex w-fit items-center gap-2 font-medium text-forest underline">
          <Printer className="h-4 w-4" /> Print verification sheet for faculty review
        </Link>
      </div>
      <ResourceManager
        title="Ayurvedic references"
        endpoint="/api/references"
        rows={rows}
        searchKeys={["plant.commonName", "textName", "citation"]}
        defaults={{ verificationStatus: "PENDING", sourceType: "CLASSICAL_AYURVEDIC_TEXT" }}
        columns={[
          { key: "plant.commonName", label: "Plant" },
          { key: "textName", label: "Text" },
          { key: "chapter", label: "Chapter" },
          { key: "verse", label: "Verse" },
          { key: "verificationStatus", label: "Status", badge: true },
          { key: "verifiedBy", label: "Verified by" },
        ]}
        fields={[
          { name: "plantId", label: "Plant", type: "select", required: true, options: plants.map((p) => ({ value: p.id, label: p.commonName })) },
          { name: "sourceType", label: "Source type", type: "select", required: true, options: Object.entries(SOURCE_TYPE_LABEL).map(([value, label]) => ({ value, label })) },
          { name: "textName", label: "Text name", type: "text", required: true },
          { name: "author", label: "Author / editor", type: "text" },
          { name: "chapter", label: "Chapter", type: "text" },
          { name: "section", label: "Section (Sthana / Varga)", type: "text" },
          { name: "verse", label: "Verse", type: "text" },
          { name: "citation", label: "Citation", type: "textarea", required: true, help: "Full citation: edition, publisher, year, page." },
          { name: "referenceUrl", label: "URL (https)", type: "url" },
          { name: "verificationStatus", label: "Verification status", type: "select", required: true, options: ["PENDING", "VERIFIED", "REJECTED"].map((v) => ({ value: v, label: v })) },
          { name: "notes", label: "Reviewer notes", type: "textarea" },
        ]}
      />
    </>
  );
}
