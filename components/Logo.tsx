import { cn } from "@/lib/utils";

/** Leaf mark: a single leaf whose midrib is topped by a bindu — Ayurveda + Devanagari in one glyph. */
export function LeafMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      <path d="M16 4.5C24.5 9 27.5 18 16 29.5 4.5 18 7.5 9 16 4.5Z" fill="#173a2b" />
      <path d="M16 8.5v19" stroke="#f3ebda" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M16 14.5l-4.2-3.2M16 19l-5.2-3.4M16 14.5l4.2-3.2M16 19l5.2-3.4M16 23.3l-3.8-2.4M16 23.3l3.8-2.4" stroke="#93a86e" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="16" cy="2.6" r="1.7" fill="#b8892e" />
    </svg>
  );
}

/** The wordmark always renders as one unit: हरि + tima. */
export function Wordmark({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const sizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-[clamp(4rem,14vw,9.5rem)]",
  } as const;
  return (
    <span className={cn("inline-flex items-baseline leading-none", sizes[size], className)} aria-label="Haritima" lang="hi">
      <span className="deva font-normal text-forest" aria-hidden>
        हरि
      </span>
      <span
        className="font-sans font-light tracking-[-0.02em] text-leaf"
        style={{ marginLeft: "0.02em" }}
        aria-hidden
      >
        tima
      </span>
    </span>
  );
}

export function Logo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const mark = { sm: "h-6 w-6", md: "h-8 w-8", lg: "h-12 w-12" }[size];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LeafMark className={mark} />
      <Wordmark size={size} />
    </span>
  );
}
