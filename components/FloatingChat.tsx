"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { Chatbot } from "./Chatbot";
import { useLang } from "@/lib/i18n/client";

export function FloatingChat() {
  const pathname = usePathname();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  if (pathname.startsWith("/chatbot")) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="false"
            aria-label={t.chat.title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-x-0 bottom-0 z-50 flex h-[82vh] flex-col overflow-hidden rounded-t-2xl border border-parch bg-sandal shadow-2xl sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[600px] sm:w-[420px] sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-parch bg-forest px-4 py-3 text-sandal">
              <span className="deva text-lg">{t.chat.title}</span>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-white/10" aria-label={t.chat.close}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <Chatbot compact />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        aria-expanded={open}
        aria-label={open ? t.chat.close : t.chat.open}
        className={`fixed bottom-5 right-5 z-50 items-center gap-2 rounded-full bg-forest px-5 py-3.5 text-sandal shadow-[0_12px_30px_-10px_rgb(15_42_30/0.7)] sm:right-6 ${open ? "hidden sm:flex" : "flex"}`}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        <span className="hidden sm:inline">{t.nav.ask}</span>
      </motion.button>
    </>
  );
}
