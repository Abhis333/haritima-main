import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, MapPin, Navigation } from "lucide-react";
import { googleDirectionsUrl } from "@/lib/geo";
import { prisma } from "@/lib/prisma";
import { getDictionary, pick } from "@/lib/i18n/server";
import { PlantImage } from "@/components/PlantImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ViewBeacon } from "@/components/ViewBeacon";
import { SeasonStrip } from "@/components/SeasonStrip";
import { AVAILABILITY_LABEL, PLANT_TYPE_LABEL, SOURCE_TYPE_LABEL } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

async function getPlant(slug: string) {
  return prisma.plant.findUnique({
    where: { slug },
    include: {
      categories: true,
      locations: true,
      references: { where: { verificationStatus: { in: ["VERIFIED", "PENDING"] } }, orderBy: [{ verificationStatus: "asc" }, { createdAt: "asc" }] },
    },
  });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const plant = await getPlant((await params).slug);
  if (!plant) return { title: "Plant not found" };
  return {
    title: `${plant.commonName} (${plant.scientificName})`,
    description: plant.description.slice(0, 160),
    openGraph: { images: plant.imageUrl ? [plant.imageUrl] : undefined },
  };
}

export default async function PlantDetailPage({ params }: { params: Params }) {
  const { t, lang } = await getDictionary();
  const plant = await getPlant((await params).slug);
  if (!plant) notFound();

  const uses = lang === "hi" && plant.traditionalUsesHi.length ? plant.traditionalUsesHi : plant.traditionalUses;
  const verified = plant.references.filter((r) => r.verificationStatus === "VERIFIED");
  const pending = plant.references.filter((r) => r.verificationStatus === "PENDING");

  const facts: [string, React.ReactNode][] = [
    [t.plant.scientific, <em key="s">{plant.scientificName}</em>],
    [t.plant.hindi, plant.hindiName && <span className="deva">{plant.hindiName}</span>],
    [t.plant.sanskrit, plant.sanskritName && <span className="deva">{plant.sanskritName}</span>],
    [t.plant.family, plant.family],
    [t.plant.type, PLANT_TYPE_LABEL[plant.plantType][lang]],
    [t.plants.availability, AVAILABILITY_LABEL[plant.availability][lang]],
    [t.plant.otherNames, plant.otherNames.length ? plant.otherNames.join(", ") : null],
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Thing",
    name: plant.commonName,
    alternateName: [plant.scientificName, plant.hindiName, plant.sanskritName].filter(Boolean),
    description: plant.description,
  };

  return (
    <article className="container-h py-10">
      <ViewBeacon plantId={plant.id} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link href="/plants" className="inline-flex items-center gap-1 text-sm text-leaf hover:underline"><ArrowLeft className="h-4 w-4" /> {t.plant.back}</Link>

      <header className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-end">
        <PlantImage src={plant.imageUrl ?? plant.locations.find((l) => l.photos.length)?.photos[0] ?? null} alt={plant.imageAlt ?? plant.commonName} name={plant.hindiName ?? plant.commonName} className="aspect-[4/3] w-full rounded-xl" sizes="(max-width: 1024px) 100vw, 55vw" priority />
        <div>
          <div className="flex flex-wrap gap-2">
            {plant.categories.map((c) => (
              <Link key={c.id} href={`/plants?category=${c.slug}`}><Badge variant="leaf">{lang === "hi" ? c.nameHi : c.nameEn}</Badge></Link>
            ))}
          </div>
          <h1 className="mt-3 text-[clamp(2.5rem,6vw,4rem)]">{plant.commonName}</h1>
          {plant.hindiName && <p className="deva text-3xl text-forest/80">{plant.hindiName}</p>}
          <p className="sci mt-1 text-xl text-muted-foreground">{plant.scientificName}</p>
          <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[0.97rem]">
            {facts.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-10">
          <Section title={t.plant.about}><p className="prose-h">{pick(lang, plant.description, plant.descriptionHi)}</p></Section>

          {uses.length > 0 && (
            <Section title={t.plant.uses}>
              <ul className="prose-h list-disc space-y-2 pl-5 marker:text-leaf">{uses.map((u) => <li key={u}>{u}</li>)}</ul>
              <p className="mt-3 text-sm text-muted-foreground">{t.common.disclaimerShort}</p>
            </Section>
          )}
          {plant.plantParts.length > 0 && (
            <Section title={t.plant.parts}>
              <ul className="flex flex-wrap gap-2">{plant.plantParts.map((p) => <li key={p}><Badge>{p}</Badge></li>)}</ul>
            </Section>
          )}
          {plant.ayurvedicProperties && <Section title={t.plant.properties}><p className="prose-h whitespace-pre-line">{plant.ayurvedicProperties}</p></Section>}
          {plant.preparation && <Section title={t.plant.preparation}><p className="prose-h whitespace-pre-line">{plant.preparation}</p></Section>}
          {plant.cultivation && <Section title={t.plant.cultivation}><p className="prose-h whitespace-pre-line">{plant.cultivation}</p></Section>}
          {plant.precautions && (
            <Section title={t.plant.precautions}>
              <p className="prose-h rounded-md border-l-4 border-haldi bg-[#f3e8cf] px-4 py-3 whitespace-pre-line">{plant.precautions}</p>
            </Section>
          )}

          <Section title={t.plant.references} icon={<BookOpen className="h-5 w-5 text-leaf" />}>
            {verified.length === 0 && <p className="rounded-md bg-[#f3e2bd] px-4 py-3 text-[#7a5a14]">{t.plant.noRefs}</p>}
            <div className="space-y-4">
              {verified.map((r) => (
                <div key={r.id} className="rounded-lg border border-[#a9c48c] bg-[#f4f8ec] p-4">
                  <Badge variant="verified">{t.plant.verified}</Badge>
                  <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 text-[0.95rem]">
                    <dt className="text-muted-foreground">{t.plant.source}</dt><dd>{SOURCE_TYPE_LABEL[r.sourceType]}</dd>
                    <dt className="text-muted-foreground">{t.plant.text}</dt><dd className="font-medium">{r.textName}{r.author ? ` — ${r.author}` : ""}</dd>
                    {(r.chapter || r.section) && (<><dt className="text-muted-foreground">{t.plant.sectionChapter}</dt><dd>{[r.section, r.chapter].filter(Boolean).join(", ")}</dd></>)}
                    {r.verse && (<><dt className="text-muted-foreground">{t.plant.verse}</dt><dd>{r.verse}</dd></>)}
                    <dt className="text-muted-foreground">{t.plant.reference}</dt>
                    <dd>{r.referenceUrl ? <a href={r.referenceUrl} target="_blank" rel="noopener noreferrer" className="text-leaf underline">{r.citation}</a> : r.citation}</dd>
                  </dl>
                </div>
              ))}
              {pending.map((r) => (
                <div key={r.id} className="rounded-lg border border-dashed border-[#e0c483] p-4 text-[0.95rem]">
                  <Badge variant="pending">{t.plant.pending}</Badge>
                  <p className="mt-2 text-muted-foreground">{r.textName}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-parch bg-card p-5">
            <h2 className="flex items-center gap-2 text-2xl"><MapPin className="h-5 w-5 text-leaf" /> {t.plant.location}</h2>
            {plant.locations.length === 0 ? (
              <p className="mt-3 text-muted-foreground">{t.plant.noLocation}</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {plant.locations.map((l) => (
                  <li key={l.id} className="border-t border-parch pt-3 first:border-0 first:pt-0">
                    <p className="font-medium text-forest">{l.campusArea}</p>
                    {l.locationDescription && <p className="text-[0.95rem]">{l.locationDescription}</p>}
                    {l.landmark && <p className="text-sm text-muted-foreground">{l.landmark}</p>}
                    <Badge variant={l.isApproximate ? "pending" : "verified"} className="mt-1.5">{l.isApproximate ? t.plant.approximate : t.plant.exact}</Badge>
                    {l.photos.length > 0 && (
                      <ul className="mt-3 grid grid-cols-3 gap-1.5" aria-label={t.plant.spotPhotos}>
                        {l.photos.map((src, i) => (
                          <li key={src}>
                            <a href={src} target="_blank" rel="noopener noreferrer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt={`${plant.commonName}, ${l.campusArea} (${i + 1})`} loading="lazy" className="aspect-square w-full rounded-md object-cover" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {plant.locations.length > 0 && (
              <>
                <Button asChild className="mt-5 w-full"><Link href={`/map?plant=${plant.slug}`}><MapPin /> {t.plant.viewOnMap}</Link></Button>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button asChild variant="outline"><Link href={`/map?plant=${plant.slug}&guide=1`}><Navigation /> {t.map.guide}</Link></Button>
                  <Button asChild variant="outline">
                    <a href={googleDirectionsUrl(plant.locations[0].latitude, plant.locations[0].longitude)} target="_blank" rel="noopener noreferrer">{t.map.directions} ↗</a>
                  </Button>
                </div>
              </>
            )}
          </div>
          <div className="rounded-xl border border-parch bg-card p-5">
            <h2 className="text-2xl">{t.seasons.onCampus}</h2>
            {plant.floweringMonths.length || plant.fruitingMonths.length ? (
              <SeasonStrip flowering={plant.floweringMonths} fruiting={plant.fruitingMonths} labels={t.seasons} className="mt-4" />
            ) : (
              <p className="mt-3 text-muted-foreground">{t.seasons.notRecorded}</p>
            )}
            <Link href="/seasons" className="mt-3 inline-block text-sm font-medium text-leaf hover:underline">{t.seasons.title} →</Link>
          </div>
          <Button asChild variant="gold" className="w-full"><Link href="/chatbot">{t.hero.ask}</Link></Button>
        </aside>
      </div>
    </article>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-3xl">{icon}{title}</h2>
      {children}
    </section>
  );
}
