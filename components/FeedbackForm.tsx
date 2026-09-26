"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

export function FeedbackForm() {
  const { t } = useLang();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setState("sending");
    const body = Object.fromEntries(new FormData(form).entries());
    const res = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      setState("sent");
      form.reset();
    } else setState("error");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="fb-name">{t.contact.name}</Label><Input id="fb-name" name="name" required minLength={2} maxLength={100} autoComplete="name" /></div>
        <div className="space-y-1.5"><Label htmlFor="fb-email">{t.contact.email}</Label><Input id="fb-email" name="email" type="email" required maxLength={200} autoComplete="email" /></div>
      </div>
      <div className="space-y-1.5"><Label htmlFor="fb-subject">{t.contact.subject}</Label><Input id="fb-subject" name="subject" required minLength={2} maxLength={150} /></div>
      <div className="space-y-1.5"><Label htmlFor="fb-message">{t.contact.message}</Label><Textarea id="fb-message" name="message" required minLength={10} maxLength={3000} rows={6} /></div>
      {/* honeypot for bots */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <Button type="submit" disabled={state === "sending"}>{t.contact.send}</Button>
      <p role="status" aria-live="polite" className={state === "error" ? "text-[#8a2e22]" : "text-leaf"}>
        {state === "sent" ? t.contact.sent : state === "error" ? t.contact.error : ""}
      </p>
    </form>
  );
}
