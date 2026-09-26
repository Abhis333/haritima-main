import Link from "next/link";
import { Logo } from "./Logo";
import { getDictionary } from "@/lib/i18n/server";

export async function Footer() {
  const { t } = await getDictionary();
  const links = [
    { href: "/plants", label: t.nav.plants },
    { href: "/map", label: t.nav.map },
    { href: "/identify", label: t.nav.identify },
    { href: "/ayurveda", label: t.nav.ayurveda },
    { href: "/mantras", label: t.nav.mantras },
    { href: "/about", label: t.nav.about },
    { href: "/contact", label: t.nav.contact },
    { href: "/privacy", label: t.footer.privacy },
    { href: "/terms", label: t.footer.terms },
  ];
  return (
    <footer className="mt-24 bg-forest text-sandal/85">
      <div className="container-h grid gap-10 py-14 md:grid-cols-[1.2fr_2fr]">
        <div>
          <div className="inline-block rounded-lg bg-sandal px-3 py-2">
            <Logo size="md" />
          </div>
          <p className="mt-4 max-w-sm text-sandal/80">{t.footer.tagline}</p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white hover:underline underline-offset-4">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="container-h flex flex-col gap-2 py-5 text-sm text-sandal/65 sm:flex-row sm:justify-between">
          <p>{t.footer.academic}</p>
          <p>© {new Date().getFullYear()} हरिtima · DSVV</p>
        </div>
      </div>
    </footer>
  );
}
