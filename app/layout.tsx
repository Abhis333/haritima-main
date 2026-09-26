import type { Metadata, Viewport } from "next";
import { Mukta, Tiro_Devanagari_Hindi, Tiro_Devanagari_Sanskrit } from "next/font/google";
import "./globals.css";
import { getLang } from "@/lib/i18n/server";
import { LanguageProvider } from "@/lib/i18n/client";

const mukta = Mukta({ subsets: ["latin", "devanagari"], weight: ["300", "400", "500", "600"], variable: "--font-mukta", display: "swap" });
const tiro = Tiro_Devanagari_Hindi({ subsets: ["latin", "devanagari"], weight: "400", style: ["normal", "italic"], variable: "--font-tiro", display: "swap" });
const tiroSanskrit = Tiro_Devanagari_Sanskrit({ subsets: ["latin", "devanagari"], weight: "400", variable: "--font-tiro-sanskrit", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "हरिtima — Plants of Dev Sanskriti Vishwavidyalaya", template: "%s · हरिtima" },
  description:
    "Discover the plants of Dev Sanskriti Vishwavidyalaya, Shantikunj, Haridwar — campus locations, traditional Ayurvedic uses with verified references, Vedic mantras, and an AI plant guide.",
  keywords: ["Haritima", "DSVV", "Shantikunj", "Ayurveda", "medicinal plants", "Haridwar", "campus map", "Vedic mantras"],
  openGraph: { title: "हरिtima", description: "Discover the Green Wisdom of Shantikunj", type: "website", locale: "en_IN", alternateLocale: ["hi_IN"] },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#173a2b", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} className={`${mukta.variable} ${tiro.variable} ${tiroSanskrit.variable}`}>
      <body>
        <LanguageProvider lang={lang}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
