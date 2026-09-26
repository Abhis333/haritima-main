"use client";

import { useLang } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang, pending } = useLang();
  return (
    <div
      role="group"
      aria-label="Language / भाषा"
      className={cn("inline-flex items-center rounded-full border border-forest/20 p-0.5 text-sm", pending && "opacity-60", className)}
    >
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => l !== lang && setLang(l)}
          aria-pressed={lang === l}
          className={cn(
            "rounded-full px-3 py-1 transition-colors",
            lang === l ? "bg-forest text-sandal" : "text-forest hover:bg-forest/5",
            l === "hi" && "deva",
          )}
        >
          {l === "en" ? "EN" : "हिन्दी"}
        </button>
      ))}
    </div>
  );
}
