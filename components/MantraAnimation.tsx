"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

/** Split into grapheme clusters so Devanagari matras and conjuncts never detach from their consonant. */
function graphemes(text: string) {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter("sa", { granularity: "grapheme" });
    return Array.from(seg.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

export function MantraText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  const lines = useMemo(() => text.split("\n").map((l) => graphemes(l)), [text]);
  const total = lines.reduce((n, l) => n + l.length, 0);
  const step = Math.min(0.045, 2.4 / Math.max(total, 1)); // long mantras still finish in ~2.5s

  if (reduce) {
    return (
      <p lang="sa" className={cn("sanskrit whitespace-pre-line", className)}>
        {text}
      </p>
    );
  }
  let i = 0;
  return (
    <motion.p lang="sa" className={cn("sanskrit", className)} initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.4 }} aria-label={text}>
      {lines.map((line, li) => (
        <span key={li} className="block" aria-hidden>
          {line.map((g, gi) => {
            const d = delay + i++ * step;
            return (
              <motion.span
                key={gi}
                variants={{ hidden: { opacity: 0, filter: "blur(4px)" }, shown: { opacity: 1, filter: "blur(0px)", transition: { delay: d, duration: 0.5 } } }}
              >
                {g}
              </motion.span>
            );
          })}
        </span>
      ))}
    </motion.p>
  );
}

export type MantraView = {
  id: string;
  title: string;
  sanskritText: string;
  transliteration: string | null;
  hindiTranslation: string;
  englishTranslation: string;
  meaning: string | null;
  source: string;
  verificationStatus: string;
  category: string;
  audioUrl: string | null;
};

export function MantraCard({
  mantra,
  labels,
  large = false,
}: {
  mantra: MantraView;
  labels: { source: string; hindi: string; english: string; meaning: string; listen: string; pending: string };
  large?: boolean;
}) {
  const reduce = useReducedMotion();
  const after = reduce ? 0 : Math.min(2.6, mantra.sanskritText.length * 0.03) + 0.2;
  return (
    <article className={cn("relative overflow-hidden rounded-xl border border-parch bg-card", large ? "p-8 sm:p-12" : "p-6 sm:p-8")}>
      <FloatingLeaves />
      <div className="relative">
        <p className="text-sm text-leaf">{mantra.category}</p>
        <h3 className="mt-1 text-xl">{mantra.title}</h3>
        <MantraText text={mantra.sanskritText} className={cn("mt-5 text-forest", large ? "text-[clamp(1.6rem,3.4vw,2.5rem)] leading-[1.6]" : "text-2xl leading-[1.7]")} />
        {mantra.transliteration && <p className="mt-3 italic text-muted-foreground">{mantra.transliteration}</p>}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: after, duration: 0.6 }}
          className="mt-6 grid gap-5 border-t border-parch pt-5 md:grid-cols-2"
        >
          <div>
            <p className="text-sm text-muted-foreground">{labels.hindi}</p>
            <p lang="hi" className="deva mt-1 text-lg leading-relaxed">{mantra.hindiTranslation}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{labels.english}</p>
            <p className="mt-1 leading-relaxed">{mantra.englishTranslation}</p>
          </div>
          {mantra.meaning && (
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">{labels.meaning}</p>
              <p className="mt-1 leading-relaxed">{mantra.meaning}</p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 md:col-span-2">
            <p className="text-sm">
              <span className="text-muted-foreground">{labels.source}:</span> {mantra.source}
              {mantra.verificationStatus !== "VERIFIED" && <span className="ml-2 text-[#7a5a14]">({labels.pending})</span>}
            </p>
            {mantra.audioUrl && <audio controls preload="none" src={mantra.audioUrl} className="h-9 max-w-full" aria-label={`${labels.listen}: ${mantra.title}`} />}
          </div>
        </motion.div>
      </div>
    </article>
  );
}

function FloatingLeaves() {
  const reduce = useReducedMotion();
  const leaves = [
    { x: "86%", y: "10%", r: 20, s: 1 },
    { x: "92%", y: "46%", r: -30, s: 0.7 },
    { x: "78%", y: "78%", r: 50, s: 0.85 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {leaves.map((l, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 24 24"
          className="absolute h-10 w-10 text-moss/35"
          style={{ left: l.x, top: l.y, rotate: l.r, scale: l.s }}
          animate={reduce ? undefined : { y: [0, -8, 0], rotate: [l.r, l.r + 8, l.r] }}
          transition={{ duration: 9 + i * 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M12 2C19 6 21 13 12 22 3 13 5 6 12 2Z" fill="currentColor" />
        </motion.svg>
      ))}
    </div>
  );
}
