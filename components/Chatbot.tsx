"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, BookOpen, MapPin, SendHorizontal, Sprout } from "lucide-react";
import { useLang } from "@/lib/i18n/client";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn, SOURCE_TYPE_LABEL } from "@/lib/utils";
import type { ChatAnswer } from "@/lib/chat";

type Msg = { id: string; role: "user"; text: string } | { id: string; role: "assistant"; answer: ChatAnswer } | { id: string; role: "error"; text: string };

export function Chatbot({ compact = false }: { compact?: boolean }) {
  const { t, lang } = useLang();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), [messages, busy]);

  async function ask(text: string) {
    const q = text.trim();
    if (q.length < 2 || busy) return;
    setInput("");
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text: q }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, lang, conversationId }),
      });
      if (res.status === 429) throw new Error(t.chat.rateLimited);
      if (!res.ok) throw new Error(t.chat.error);
      const data = (await res.json()) as { answer: ChatAnswer; conversationId?: string };
      if (data.conversationId) setConversationId(data.conversationId);
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", answer: data.answer }]);
    } catch (e) {
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "error", text: e instanceof Error ? e.message : t.chat.error }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("flex h-full flex-col", compact ? "min-h-0" : "min-h-[520px]")}>
      <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5" aria-live="polite">
        {messages.length === 0 && (
          <div>
            <p className="text-muted-foreground">{t.chat.sub}</p>
            <ul className="mt-4 flex flex-col gap-2">
              {t.chat.examples.slice(0, compact ? 3 : 4).map((ex) => (
                <li key={ex}>
                  <button
                    type="button"
                    onClick={() => ask(ex)}
                    className="w-full rounded-md border border-parch bg-[#fbf7ee] px-3.5 py-2.5 text-left text-[0.95rem] text-ink/85 transition-colors hover:border-leaf/50 hover:bg-white"
                  >
                    {ex}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              {m.role === "user" && (
                <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-forest px-4 py-2.5 text-sandal">{m.text}</div>
              )}
              {m.role === "error" && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-[#f6e3de] px-4 py-3 text-[#8a2e22]">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {m.text}
                </div>
              )}
              {m.role === "assistant" && <AnswerView answer={m.answer} />}
            </motion.div>
          ))}
        </AnimatePresence>

        {busy && (
          <div className="flex items-center gap-2 text-muted-foreground" role="status">
            <Sprout className="h-4 w-4 animate-bounce text-leaf" /> {t.chat.thinking}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex items-end gap-2 border-t border-parch bg-card/80 p-3"
      >
        <label htmlFor={compact ? "chat-input-compact" : "chat-input"} className="sr-only">
          {t.chat.title}
        </label>
        <textarea
          id={compact ? "chat-input-compact" : "chat-input"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(input);
            }
          }}
          rows={1}
          maxLength={800}
          placeholder={t.chat.placeholder}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-input bg-[#fbf7ee] px-4 py-2.5 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" size="icon" disabled={busy || input.trim().length < 2} aria-label={t.chat.send}>
          <SendHorizontal />
        </Button>
      </form>
    </div>
  );
}

function AnswerView({ answer }: { answer: ChatAnswer }) {
  const { t } = useLang();
  return (
    <div className="space-y-3">
      {answer.urgent && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-[#f6e3de] px-4 py-3 font-medium text-[#8a2e22]" role="alert">
          <AlertTriangle className="mt-1 h-4 w-4 shrink-0" /> {answer.urgent}
        </div>
      )}
      {answer.context && <p className="text-ink">{answer.context}</p>}

      {answer.plants.map((p) => (
        <article key={p.id} className="rounded-lg border border-parch bg-[#fbf7ee] p-4">
          <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Link href={`/plants/${p.slug}`} className="text-lg font-semibold text-forest hover:underline">
              {p.commonName}
            </Link>
            {(p.hindiName || p.sanskritName) && (
              <span className="deva text-forest/80">{[p.hindiName, p.sanskritName].filter(Boolean).join(" / ")}</span>
            )}
            <span className="sci text-sm text-muted-foreground">{p.scientificName}</span>
          </header>

          <dl className="mt-3 space-y-2.5 text-[0.95rem]">
            <div>
              <dt className="text-sm text-muted-foreground">{t.chat.traditional}</dt>
              <dd>{p.association}</dd>
              {p.plantParts.length > 0 && (
                <dd className="mt-0.5 text-sm text-muted-foreground">
                  {t.chat.parts}: {p.plantParts.join(", ")}
                </dd>
              )}
            </div>
            <div>
              <dt className="flex items-center gap-1 text-sm text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5" /> {t.chat.reference}
              </dt>
              {p.references.length > 0 ? (
                p.references.map((r, i) => (
                  <dd key={i} className="mt-1">
                    <Badge variant="verified" className="mr-2">{t.plant.verified}</Badge>
                    <span className="font-medium">{r.textName}</span>
                    {[r.chapter, r.section, r.verse].filter(Boolean).length > 0 && (
                      <span> — {[r.chapter, r.section, r.verse].filter(Boolean).join(", ")}</span>
                    )}
                    <span className="block text-sm text-muted-foreground">
                      {r.citation} · {SOURCE_TYPE_LABEL[r.sourceType]}
                    </span>
                  </dd>
                ))
              ) : (
                <dd className="mt-1 text-[#7a5a14]">{p.referenceNote}</dd>
              )}
            </div>
            <div>
              <dt className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {t.chat.location}
              </dt>
              <dd>
                {p.location ? (
                  <>
                    {p.location.campusArea}
                    {p.location.locationDescription ? ` — ${p.location.locationDescription}` : ""}
                    {p.location.isApproximate && <Badge variant="outline" className="ml-2">{t.map.approximate}</Badge>}
                  </>
                ) : (
                  t.plant.noLocation
                )}
              </dd>
            </div>
          </dl>
          {p.precautions && <p className="mt-3 rounded-md bg-[#f3e8cf] px-3 py-2 text-sm text-bark">⚠ {p.precautions}</p>}
          {p.location && (
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href={`/map?plant=${p.slug}`}>
                <MapPin /> {t.chat.onMap}
              </Link>
            </Button>
          )}
        </article>
      ))}

      <p className="border-l-2 border-haldi pl-3 text-sm text-muted-foreground">{answer.disclaimer}</p>
    </div>
  );
}
