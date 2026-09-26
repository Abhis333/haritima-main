import "server-only";
import { cookies } from "next/headers";
import { dictionaries, LANG_COOKIE, type Lang } from "./dictionaries";

export async function getLang(): Promise<Lang> {
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  return c === "hi" ? "hi" : "en";
}

export async function getDictionary() {
  const lang = await getLang();
  return { lang, t: dictionaries[lang] };
}

export { pick } from "./pick";
