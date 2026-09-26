import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { Chatbot } from "@/components/Chatbot";

export const metadata: Metadata = { title: "Ask Haritima", description: "An AI guide that answers only from Haritima’s verified plant records." };

export default async function ChatbotPage() {
  const { t } = await getDictionary();
  return (
    <div className="container-h py-10">
      <h1 className="deva text-5xl">{t.chat.title}</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="flex h-[min(78vh,760px)] flex-col overflow-hidden rounded-xl border border-parch bg-card">
          <Chatbot />
        </div>
        <aside className="space-y-4 text-[0.95rem] text-ink/80">
          <p>{t.home.askSub}</p>
          <p className="border-l-2 border-haldi pl-3 text-sm text-muted-foreground">{t.common.disclaimerShort}</p>
        </aside>
      </div>
    </div>
  );
}
