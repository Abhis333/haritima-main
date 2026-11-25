import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/server";
import { LoginForm } from "@/components/AuthForms";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Sign in" };

/**
 * Only same-site relative paths are allowed. Backslashes and control characters are rejected
 * because browsers treat "/\host" like "//host".
 */
function safeRedirectPath(raw: string) {
  if (!raw.startsWith("/") || raw.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(raw)) return "/";
  const base = "http://haritima.invalid";
  try {
    const url = new URL(raw, base);
    return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : "/";
  } catch {
    return "/";
  }
}

export default async function LoginPage() {
  const { t } = await getDictionary();

  async function login(fd: FormData) {
    "use server";
    const redirectTo = safeRedirectPath(String(fd.get("callbackUrl") ?? "/"));
    try {
      // redirect: false — Auth.js would otherwise build an absolute URL from its own idea of the host,
      // which behind a proxy can be the internal address (e.g. https://localhost:8080).
      await signIn("credentials", { email: fd.get("email"), password: fd.get("password"), redirect: false });
    } catch (e) {
      if (e instanceof AuthError) return { error: "invalid" };
      throw e;
    }
    redirect(redirectTo); // same-site relative path only (see safeRedirectPath)
  }

  return (
    <div className="container-h flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-xl border border-parch bg-card p-8">
        <Logo size="md" />
        <h1 className="mt-6 text-3xl">{t.auth.title}</h1>
        <div className="mt-6"><Suspense><LoginForm action={login} /></Suspense></div>
      </div>
    </div>
  );
}
