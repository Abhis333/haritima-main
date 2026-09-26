import type { Lang } from "./dictionaries";

/** Picks the Hindi field when the UI is Hindi and a translation exists. Safe for client and server. */
export function pick(lang: Lang, en: string, hi?: string | null) {
  return lang === "hi" && hi ? hi : en;
}
