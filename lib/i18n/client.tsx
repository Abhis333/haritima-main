"use client";

import { createContext, useContext, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { dictionaries, LANG_COOKIE, type Dictionary, type Lang } from "./dictionaries";

type Ctx = { lang: Lang; t: Dictionary; setLang: (l: Lang) => void; pending: boolean };
const LangContext = createContext<Ctx | null>(null);

export function LanguageProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const setLang = (l: Lang) => {
    // Cookie so server components render in the chosen language on every visit (1 year).
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = l;
    start(() => router.refresh());
  };
  return <LangContext.Provider value={{ lang, t: dictionaries[lang], setLang, pending }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}
