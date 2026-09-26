import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { FeedbackForm } from "@/components/FeedbackForm";

export const metadata: Metadata = { title: "Contact & feedback" };

export default async function ContactPage() {
  const { t } = await getDictionary();
  return (
    <div className="container-h max-w-3xl py-12">
      <h1 className="text-5xl">{t.contact.title}</h1>
      <p className="mt-3 prose-h">{t.contact.sub}</p>
      <div className="mt-8 rounded-xl border border-parch bg-card p-6 sm:p-8"><FeedbackForm /></div>
    </div>
  );
}
