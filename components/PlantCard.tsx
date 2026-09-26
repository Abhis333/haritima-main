import Link from "next/link";
import { PlantImage } from "./PlantImage";
import type { Lang } from "@/lib/i18n/dictionaries";
import { pick } from "@/lib/i18n/pick";

export type PlantCardData = {
  slug: string;
  commonName: string;
  scientificName: string;
  hindiName: string | null;
  sanskritName: string | null;
  description: string;
  descriptionHi: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  categories: { slug: string; nameEn: string; nameHi: string }[];
};

export function PlantCard({ plant, lang, viewLabel }: { plant: PlantCardData; lang: Lang; viewLabel: string }) {
  const desc = pick(lang, plant.description, plant.descriptionHi);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-parch bg-card transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgb(23_58_43/0.6)]">
      <PlantImage
        src={plant.imageUrl}
        alt={plant.imageAlt ?? plant.commonName}
        name={plant.hindiName ?? plant.commonName}
        className="aspect-[4/3] w-full transition-transform duration-500 group-hover:scale-[1.02]"
      />
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-2xl">
          <Link href={`/plants/${plant.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {plant.commonName}
          </Link>
        </h3>
        {plant.hindiName && <p className="deva text-lg text-forest/80">{plant.hindiName}</p>}
        <p className="sci mt-0.5 text-[0.95rem] text-muted-foreground">{plant.scientificName}</p>
        <p className="mt-3 line-clamp-2 text-[0.95rem] text-ink/80">{desc}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <p className="text-sm text-leaf">{plant.categories.map((c) => (lang === "hi" ? c.nameHi : c.nameEn)).join(", ")}</p>
          <span className="shrink-0 text-sm font-medium text-forest underline-offset-4 group-hover:underline">{viewLabel}</span>
        </div>
      </div>
    </article>
  );
}
