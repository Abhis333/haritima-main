"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "@/lib/i18n/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function LoginForm({ action }: { action: (fd: FormData) => Promise<{ error?: string } | void> }) {
  const { t } = useLang();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      action={async (fd) => {
        setBusy(true);
        setError(null);
        fd.set("callbackUrl", params.get("callbackUrl") ?? "/");
        const res = await action(fd);
        if (res?.error) setError(t.auth.invalid);
        setBusy(false);
      }}
      className="space-y-4"
    >
      <div className="space-y-1.5"><Label htmlFor="email">{t.auth.email}</Label><Input id="email" name="email" type="email" required autoComplete="email" /></div>
      <div className="space-y-1.5"><Label htmlFor="password">{t.auth.password}</Label><Input id="password" name="password" type="password" required minLength={8} autoComplete="current-password" /></div>
      {error && <p role="alert" className="text-[#8a2e22]">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy}>{t.auth.submit}</Button>
      <p className="text-center text-sm text-muted-foreground">
        {t.auth.noAccount} <Link href="/register" className="text-leaf underline">{t.auth.register}</Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const { t } = useLang();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Account could not be created.");
    router.push("/login?registered=1");
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5"><Label htmlFor="name">{t.auth.name}</Label><Input id="name" name="name" required minLength={2} maxLength={100} autoComplete="name" /></div>
      <div className="space-y-1.5"><Label htmlFor="email">{t.auth.email}</Label><Input id="email" name="email" type="email" required autoComplete="email" /></div>
      <div className="space-y-1.5"><Label htmlFor="password">{t.auth.password}</Label><Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" /></div>
      {error && <p role="alert" className="text-[#8a2e22]">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy}>{t.auth.create}</Button>
      <p className="text-center text-sm text-muted-foreground">
        {t.auth.haveAccount} <Link href="/login" className="text-leaf underline">{t.auth.submit}</Link>
      </p>
    </form>
  );
}
