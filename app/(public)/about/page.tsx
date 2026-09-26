import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "About Haritima" };

export default async function AboutPage() {
  const { lang } = await getDictionary();
  const hi = lang === "hi";
  return (
    <div className="container-h py-12">
      <Logo size="lg" />
      <h1 className="mt-6 text-5xl">{hi ? "हरिtima के बारे में" : "About Haritima"}</h1>
      <div className="mt-6 space-y-5 prose-h">
        <p>{hi
          ? "‘हरि’ का अर्थ है हरा, और हरिमा हरियाली का भाव। हरिtima देव संस्कृति विश्वविद्यालय, शांतिकुंज, हरिद्वार के परिसर में उगने वाले पौधों का एक डिजिटल वनस्पति उद्यान है।"
          : "“Hari” means green, and harima the quality of greenness. Haritima is a digital botanical garden for the plants growing on the campus of Dev Sanskriti Vishwavidyalaya, Shantikunj, Haridwar."}</p>
        <p>{hi
          ? "हर पौधे का वैज्ञानिक विवरण, परिसर में उसका स्थान, और पारंपरिक आयुर्वेदिक उपयोग — स्रोत सहित — एक जगह मिलते हैं। कृत्रिम बुद्धि आधारित मार्गदर्शक केवल इन्हीं सत्यापित अभिलेखों से उत्तर देता है।"
          : "Each plant’s botanical details, its place on campus, and its traditional Ayurvedic uses — with sources — sit in one record. The AI guide answers only from these verified records."}</p>
        <p>{hi
          ? "यह परियोजना शैक्षिक है। यहाँ की कोई भी जानकारी चिकित्सीय सलाह नहीं है।"
          : "This is an academic project. Nothing here is medical advice."}</p>
      </div>
      <h2 className="mt-12 text-3xl">{hi ? "तकनीक" : "How it’s built"}</h2>
      <p className="mt-3 prose-h">Next.js, TypeScript, Tailwind CSS, PostgreSQL with Prisma, Auth.js, Leaflet with OpenStreetMap, retrieval-augmented generation over the verified knowledge base, and Pl@ntNet for photo identification.</p>
    </div>
  );
}
