import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { PlantIdentifier } from "@/components/PlantIdentifier";

export const metadata: Metadata = { title: "Identify a plant", description: "Upload a photo to identify a plant and see whether it grows on the DSVV campus." };

export default async function IdentifyPage() {
  const { t } = await getDictionary();
  return (
    <div className="container-h py-10">
      <h1 className="text-5xl">{t.identify.title}</h1>
      <p className="mt-3 prose-h">{t.identify.sub}</p>
      <div className="mt-8"><PlantIdentifier /></div>
    </div>
  );
}
