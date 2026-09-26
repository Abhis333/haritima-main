"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, LogIn, LogOut, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button } from "./ui/button";
import { useLang } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

type Props = { user: { name: string; role: "USER" | "ADMIN" } | null; logout: () => Promise<void> };

export function NavbarClient({ user, logout }: Props) {
  const { t } = useLang();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/plants", label: t.nav.plants },
    { href: "/map", label: t.nav.map },
    { href: "/ayurveda", label: t.nav.ayurveda },
    { href: "/mantras", label: t.nav.mantras },
    { href: "/chatbot", label: t.nav.ask },
    { href: "/about", label: t.nav.about },
  ];
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-parch/80 bg-sandal/85 backdrop-blur-md">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded focus:bg-forest focus:px-3 focus:py-2 focus:text-sandal">
        Skip to content
      </a>
      <nav className="container-h flex h-16 items-center justify-between gap-4" aria-label="Main">
        <Link href="/" aria-label="Haritima home" className="shrink-0">
          <Logo size="sm" />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active(l.href) ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[0.95rem] text-ink/80 transition-colors hover:text-forest",
                  active(l.href) && "bg-forest/8 text-forest",
                )}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher />
          {user?.role === "ADMIN" && (
            <Button asChild variant="outline" size="sm">
              <Link href="/admin">
                <LayoutDashboard /> {t.nav.admin}
              </Link>
            </Button>
          )}
          {user ? (
            <form action={logout}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut /> {t.nav.logout}
              </Button>
            </form>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">
                <LogIn /> {t.nav.login}
              </Link>
            </Button>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-forest hover:bg-forest/5 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X /> : <Menu />}
          <span className="sr-only">{t.nav.menu}</span>
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-t border-parch bg-sandal lg:hidden"
          >
            <ul className="container-h flex flex-col py-3">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} aria-current={active(l.href) ? "page" : undefined} className={cn("block rounded-md px-2 py-3 text-lg", active(l.href) ? "text-forest font-medium" : "text-ink/80")}>
                    {l.label}
                  </Link>
                </li>
              ))}
              <li className="mt-2 flex flex-wrap items-center gap-2 border-t border-parch pt-4">
                <LanguageSwitcher />
                {user?.role === "ADMIN" && (
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin">{t.nav.admin}</Link>
                  </Button>
                )}
                {user ? (
                  <form action={logout}>
                    <Button variant="ghost" size="sm" type="submit">{t.nav.logout}</Button>
                  </form>
                ) : (
                  <Button asChild size="sm">
                    <Link href="/login">{t.nav.login}</Link>
                  </Button>
                )}
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
