import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Ayurvedic knowledge", description: "Traditional Ayurvedic concepts behind Haritima’s plant records and how sources are verified." };

const CONCEPTS = [
  { term: "Dravyaguna", hi: "द्रव्यगुण", en: "The branch of Ayurveda that studies medicinal substances — mostly plants — and their properties and actions.", hiText: "आयुर्वेद की वह शाखा जो औषधीय द्रव्यों — मुख्यतः पौधों — के गुण और कर्म का अध्ययन करती है।" },
  { term: "Rasa", hi: "रस", en: "Taste. Classical texts describe six: sweet, sour, salty, pungent, bitter and astringent.", hiText: "स्वाद। शास्त्रीय ग्रंथ छह रस बताते हैं: मधुर, अम्ल, लवण, कटु, तिक्त और कषाय।" },
  { term: "Guna", hi: "गुण", en: "Qualities such as heavy or light, oily or dry, used to describe how a substance behaves.", hiText: "गुरु-लघु, स्निग्ध-रूक्ष जैसे गुण, जिनसे किसी द्रव्य के स्वभाव का वर्णन होता है।" },
  { term: "Virya", hi: "वीर्य", en: "Potency, traditionally classified as heating (ushna) or cooling (shita).", hiText: "शक्ति, जिसे परंपरागत रूप से उष्ण या शीत माना जाता है।" },
  { term: "Vipaka", hi: "विपाक", en: "The post-digestive effect of a substance.", hiText: "पाचन के बाद द्रव्य का प्रभाव।" },
  { term: "Rasayana", hi: "रसायन", en: "Substances and practices traditionally described as rejuvenating.", hiText: "वे द्रव्य और विधियाँ जिन्हें परंपरागत रूप से पुनर्यौवनकारी बताया गया है।" },
];

export default async function AyurvedaPage() {
  const { t, lang } = await getDictionary();
  const [verified, pending, concerns] = await Promise.all([
    prisma.ayurvedicReference.count({ where: { verificationStatus: "VERIFIED" } }),
    prisma.ayurvedicReference.count({ where: { verificationStatus: "PENDING" } }),
    prisma.plantBenefit.groupBy({ by: ["concern"], _count: { plantId: true }, orderBy: { concern: "asc" } }),
  ]);

  return (
    <div className="container-h py-10">
      <h1 className="text-5xl">{t.ayurveda.title}</h1>
      <p className="mt-3 prose-h">{t.ayurveda.sub}</p>

      <section className="mt-12">
        <h2 className="text-3xl">{lang === "hi" ? "मूल अवधारणाएँ" : "Core terms"}</h2>
        <dl className="mt-6 grid gap-x-10 gap-y-6 md:grid-cols-2">
          {CONCEPTS.map((c) => (
            <div key={c.term} className="border-t border-parch pt-4">
              <dt className="flex items-baseline gap-3"><span className="deva text-2xl text-forest">{c.hi}</span><span className="text-muted-foreground">{c.term}</span></dt>
              <dd className="mt-1.5 max-w-[60ch]">{lang === "hi" ? c.hiText : c.en}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-16 grid gap-8 rounded-xl border border-parch bg-card p-7 md:grid-cols-[1.3fr_1fr]">
        <div>
          <h2 className="text-3xl">{lang === "hi" ? "संदर्भ कैसे सत्यापित होते हैं" : "How references are verified"}</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 prose-h">
            <li>{lang === "hi" ? "एडमिन ग्रंथ, लेखक, अध्याय/खंड और श्लोक के साथ संदर्भ जोड़ता है। नया संदर्भ ‘लंबित’ रहता है।" : "An administrator adds the reference with its text, author, chapter or section, and verse. New references start as pending."}</li>
            <li>{lang === "hi" ? "कोई विशेषज्ञ मूल ग्रंथ या आधिकारिक प्रकाशन से मिलान करता है।" : "A qualified reviewer checks it against the original text or official publication."}</li>
            <li>{lang === "hi" ? "मिलान होने पर ही उसे ‘सत्यापित’ चिह्नित किया जाता है। केवल सत्यापित संदर्भ ही चैटबॉट के उत्तरों में उद्धृत होते हैं।" : "Only then is it marked verified. Only verified references are cited in chatbot answers."}</li>
          </ol>
        </div>
        <div className="flex flex-col justify-center gap-3">
          <p className="flex items-center justify-between rounded-md bg-[#f4f8ec] px-4 py-3"><Badge variant="verified">{t.plant.verified}</Badge><span className="deva text-3xl text-forest">{verified}</span></p>
          <p className="flex items-center justify-between rounded-md bg-[#fbf3e0] px-4 py-3"><Badge variant="pending">{t.plant.pending}</Badge><span className="deva text-3xl text-forest">{pending}</span></p>
        </div>
      </section>

      {concerns.length > 0 && (
        <section className="mt-16">
          <h2 className="text-3xl">{lang === "hi" ? "पारंपरिक उपयोग के अनुसार पौधे" : "Plants by traditional use"}</h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {concerns.map((c) => (
              <li key={c.concern}>
                <Link href={`/plants?use=${encodeURIComponent(c.concern)}`} className="inline-flex items-center gap-2 rounded-full border border-parch bg-card px-4 py-2 hover:border-forest/40">
                  <span className="capitalize text-forest">{c.concern}</span><span className="text-sm text-muted-foreground">{c._count.plantId}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="mt-12 border-l-2 border-haldi pl-3 text-sm text-muted-foreground">{t.common.disclaimerShort}</p>
    </div>
  );
}
