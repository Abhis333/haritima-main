import { prisma } from "@/lib/prisma";
import { ResourceManager } from "@/components/admin/ResourceManager";

const CATS = ["Nature", "Peace", "Health", "Environment", "Knowledge", "Well-being"];

export default async function AdminMantras() {
  const rows = await prisma.mantra.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <ResourceManager
      title="Mantras"
      endpoint="/api/mantras"
      rows={rows}
      searchKeys={["title", "source", "category"]}
      defaults={{ category: "Nature", verificationStatus: "PENDING" }}
      columns={[
        { key: "title", label: "Title" },
        { key: "category", label: "Category" },
        { key: "source", label: "Source" },
        { key: "verificationStatus", label: "Source status", badge: true },
        { key: "featured", label: "Featured" },
      ]}
      fields={[
        { name: "title", label: "Title", type: "text", required: true },
        { name: "category", label: "Category", type: "select", required: true, options: CATS.map((c) => ({ value: c, label: c })) },
        { name: "sanskritText", label: "Sanskrit text (Devanagari)", type: "textarea", required: true, help: "Use line breaks for each pada/line." },
        { name: "transliteration", label: "Transliteration (IAST)", type: "textarea" },
        { name: "hindiTranslation", label: "Hindi translation", type: "textarea", required: true },
        { name: "englishTranslation", label: "English translation", type: "textarea", required: true },
        { name: "meaning", label: "Meaning / commentary", type: "textarea" },
        { name: "source", label: "Source", type: "text", required: true, help: "e.g. Rigveda 3.62.10" },
        { name: "verificationStatus", label: "Source verification", type: "select", required: true, options: ["PENDING", "VERIFIED", "REJECTED"].map((v) => ({ value: v, label: v })) },
        { name: "audioUrl", label: "Audio", type: "audio", full: true },
        { name: "featured", label: "Show on home page", type: "checkbox" },
      ]}
    />
  );
}
