import Link from "next/link";
import { ArrowRight, Camera, Map as MapIcon, MessageCircle, Sprout } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/i18n/server";
import { Wordmark } from "@/components/Logo";
import { HeroVine } from "@/components/HeroVine";
import { PlantCard } from "@/components/PlantCard";
import { PlantMapLoader } from "@/components/PlantMapLoader";
import { MantraCard } from "@/components/MantraAnimation";
import { Button } from "@/components/ui/button";
import { getMapPoints } from "@/lib/map-data";
import { BotanicalBackdrop } from "@/components/BotanicalBackdrop";

export default async function HomePage() {
  const { t, lang } = await getDictionary();

  const [featured, categories, points, mantra, plantCount, medicinalCount, locationCount, verifiedCount] = await Promise.all([
    prisma.plant.findMany({ where: { featured: true }, include: { categories: true }, take: 6, orderBy: { commonName: "asc" } }),
    prisma.plantCategory.findMany({ include: { _count: { select: { plants: true } } }, orderBy: { nameEn: "asc" } }),
    getMapPoints(lang),
    prisma.mantra.findFirst({ where: { featured: true }, orderBy: { createdAt: "asc" } }),
    prisma.plant.count(),
    prisma.plant.count({ where: { categories: { some: { slug: { in: ["medicinal", "ayurvedic"] } } } } }),
    prisma.plantLocation.count(),
    prisma.ayurvedicReference.count({ where: { verificationStatus: "VERIFIED" } }),
  ]);

  const stats = [
    { n: plantCount, label: t.home.stats.plants },
    { n: medicinalCount, label: t.home.stats.medicinal },
    { n: locationCount, label: t.home.stats.locations },
    { n: verifiedCount, label: t.home.stats.references },
  ];

  return (
    <>
      {/* 1–2. Hero */}
      <section className="relative overflow-hidden">
        <BotanicalBackdrop />
        <div className="container-h relative pb-16 pt-14 sm:pb-24 sm:pt-20">
          <h1 className="sr-only">Haritima — {t.hero.subtitle}</h1>
          <Wordmark size="xl" />
          <HeroVine className="-mt-2 h-auto w-full max-w-3xl sm:-mt-4" />
          <p className="deva mt-6 max-w-2xl text-[clamp(1.5rem,3vw,2.25rem)] leading-snug text-forest">{t.hero.subtitle}</p>
          {lang === "en" && <p lang="hi" className="deva mt-2 text-xl text-forest/70">शांतिकुंज की हरित और आयुर्वेदिक विरासत को जानें</p>}
          <p className="prose-h mt-6">{t.hero.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link href="/plants"><Sprout /> {t.hero.explore}</Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/map"><MapIcon /> {t.hero.map}</Link></Button>
            <Button asChild size="lg" variant="gold"><Link href="/chatbot"><MessageCircle /> {t.hero.ask}</Link></Button>
          </div>
        </div>
      </section>

      {/* 11. Statistics — straight from the database */}
      <section aria-label="Campus biodiversity" className="border-y border-parch bg-card/60">
        <dl className="container-h grid grid-cols-2 divide-parch py-6 md:grid-cols-4 md:divide-x">
          {stats.map((s) => (
            <div key={s.label} className="px-2 py-3 md:px-6">
              <dd className="deva text-4xl text-forest">{s.n.toLocaleString(lang === "hi" ? "hi-IN" : "en-IN")}</dd>
              <dt className="text-sm text-muted-foreground">{s.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* 4. Featured plants */}
      <section className="container-h mt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl">{t.home.featured}</h2>
            <p className="mt-2 text-muted-foreground">{t.home.featuredSub}</p>
          </div>
          <Link href="/plants" className="inline-flex items-center gap-1 text-leaf hover:underline">{t.hero.explore} <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {featured.length ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => <PlantCard key={p.id} plant={p} lang={lang} viewLabel={t.plants.view} />)}
          </div>
        ) : (
          <p className="mt-8 rounded-lg border border-dashed border-parch p-8 text-center text-muted-foreground">No featured plants yet. Mark plants as featured in the admin dashboard.</p>
        )}
      </section>

      {/* 5. Categories */}
      <section className="container-h mt-20">
        <h2 className="text-4xl">{t.home.categories}</h2>
        <ul className="mt-6 flex flex-wrap gap-3">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/plants?category=${c.slug}`}
                className="group inline-flex items-center gap-2.5 rounded-full border border-parch bg-card px-4 py-2.5 transition-colors hover:border-forest/40"
              >
                <span className="h-3 w-3 rounded-full" style={{ background: c.color ?? "#4e7a3a" }} aria-hidden />
                <span className="font-medium text-forest">{lang === "hi" ? c.nameHi : c.nameEn}</span>
                <span className="text-sm text-muted-foreground">{c._count.plants}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 6. Map preview */}
      <section className="container-h mt-20 grid items-start gap-8 lg:grid-cols-[1fr_1.6fr]">
        <div className="lg:pt-6">
          <h2 className="text-4xl">{t.home.mapTitle}</h2>
          <p className="mt-3 prose-h">{t.home.mapSub}</p>
          <Button asChild className="mt-6" variant="outline"><Link href="/map"><MapIcon /> {t.home.openMap}</Link></Button>
        </div>
        <PlantMapLoader points={points} height="380px" interactive={false} />
      </section>

      {/* 7. Ayurvedic wisdom */}
      <section className="mt-24 bg-forest py-16 text-sandal">
        <div className="container-h grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div>
            <h2 className="text-4xl text-sandal">{t.home.wisdomTitle}</h2>
            <p className="mt-4 max-w-[60ch] leading-relaxed text-sandal/85">{t.home.wisdomBody}</p>
            <Button asChild variant="gold" className="mt-6"><Link href="/ayurveda">{t.home.readMore}</Link></Button>
          </div>
          <figure className="rounded-xl border border-white/15 bg-white/5 p-6">
            <p className="text-sm text-sandal/60">{t.plant.references}</p>
            <div className="mt-3 space-y-3 text-[0.95rem]">
              <div className="flex items-center justify-between gap-3 rounded-md bg-white/5 px-3 py-2.5">
                <span>{t.plant.text} · {t.plant.sectionChapter} · {t.plant.reference}</span>
                <span className="rounded-full bg-[#dbe8cc] px-2 py-0.5 text-xs text-[#2e5a1f]">{t.plant.verified}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-md bg-white/5 px-3 py-2.5">
                <span>{t.plant.pending}</span>
                <span className="rounded-full bg-[#f3e2bd] px-2 py-0.5 text-xs text-[#7a5a14]">PENDING</span>
              </div>
            </div>
            <figcaption className="mt-4 text-sm text-sandal/60">{t.common.disclaimerShort}</figcaption>
          </figure>
        </div>
      </section>

      {/* 8. Mantra */}
      {mantra && (
        <section className="container-h mt-20">
          <MantraCard
            mantra={mantra}
            large
            labels={{ source: t.mantras.source, hindi: t.mantras.hindi, english: t.mantras.english, meaning: t.mantras.meaning, listen: t.mantras.listen, pending: t.plant.pending }}
          />
          <Link href="/mantras" className="mt-4 inline-flex items-center gap-1 text-leaf hover:underline">{t.nav.mantras} <ArrowRight className="h-4 w-4" /></Link>
        </section>
      )}

      {/* 9–10. Chatbot + identification */}
      <section className="container-h mt-20 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-parch bg-card p-7">
          <MessageCircle className="h-6 w-6 text-leaf" aria-hidden />
          <h2 className="mt-3 text-3xl">{t.home.askTitle}</h2>
          <p className="mt-2 text-muted-foreground">{t.home.askSub}</p>
          <ul className="mt-4 space-y-2">
            {t.chat.examples.slice(0, 2).map((e) => (
              <li key={e} className="rounded-md bg-[#fbf7ee] px-3 py-2 text-[0.95rem] text-ink/80">“{e}”</li>
            ))}
          </ul>
          <Button asChild className="mt-5"><Link href="/chatbot">{t.hero.ask}</Link></Button>
        </div>
        <div className="rounded-xl border border-parch bg-[#e6ebd6] p-7">
          <Camera className="h-6 w-6 text-forest" aria-hidden />
          <h2 className="mt-3 text-3xl">{t.home.identifyTitle}</h2>
          <p className="mt-2 text-ink/75">{t.home.identifySub}</p>
          <Button asChild variant="leaf" className="mt-5"><Link href="/identify">{t.home.identifyCta}</Link></Button>
        </div>
      </section>
    </>
  );
}
