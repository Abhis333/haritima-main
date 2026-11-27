"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, BookOpen, Brain, ClipboardCheck, Footprints, FolderTree, Gauge, History, Landmark, Leaf, MapPin, Menu, MessageSquare, ScrollText, Settings, Users, X } from "lucide-react";
import { Logo } from "../Logo";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", icon: Gauge },
  { href: "/admin/plants", label: "Plants", icon: Leaf },
  { href: "/admin/locations", label: "Plant locations", icon: MapPin },
  { href: "/admin/places", label: "Campus places", icon: Landmark },
  { href: "/admin/trails", label: "Walking trails", icon: Footprints },
  { href: "/admin/references", label: "Ayurvedic references", icon: BookOpen },
  { href: "/admin/mantras", label: "Mantras", icon: ScrollText },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/knowledge", label: "Chatbot knowledge base", icon: Brain },
  { href: "/admin/evaluation", label: "Chatbot evaluation", icon: ClipboardCheck },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/admin/audit", label: "Audit log", icon: History },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nav = (
    <nav aria-label="Admin" className="flex flex-col gap-0.5">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-[0.95rem] text-sandal/75 hover:bg-white/5 hover:text-sandal", active && "bg-white/10 text-sandal")}
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        );
      })}
    </nav>
  );
  return (
    <>
      <div className="flex items-center justify-between border-b border-parch bg-sandal px-4 py-3 lg:hidden print:hidden">
        <Link href="/"><Logo size="sm" /></Link>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="rounded p-2 text-forest" aria-label="Admin menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      <aside className={cn("bg-forest-deep p-4 text-sandal lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:shrink-0 print:hidden", open ? "block" : "hidden")}>
        <Link href="/" className="mb-6 hidden rounded-md bg-sandal px-3 py-2 lg:inline-block"><Logo size="sm" /></Link>
        {nav}
        <p className="mt-8 border-t border-white/10 pt-4 text-sm text-sandal/60">Signed in as {userName}</p>
      </aside>
    </>
  );
}
