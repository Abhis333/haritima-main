"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Line-drawn herbarium sprig on the right edge plus a few drifting pollen motes. Decorative only. */
export function BotanicalBackdrop() {
  const reduce = useReducedMotion();
  const motes = [
    { l: "62%", t: "18%", d: 14 }, { l: "74%", t: "62%", d: 18 }, { l: "88%", t: "30%", d: 16 },
    { l: "55%", t: "78%", d: 20 }, { l: "93%", t: "72%", d: 15 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <svg viewBox="0 0 400 600" className="absolute -right-16 top-0 hidden h-full opacity-[0.22] md:block" fill="none" stroke="#173a2b" strokeWidth="1.1">
        <path d="M300 600 C 290 480, 250 380, 260 260 S 300 90, 250 0" />
        {[520, 450, 380, 310, 240, 170, 100].map((y, i) => {
          const side = i % 2 ? 1 : -1;
          const x = 280 - (600 - y) * 0.05;
          return (
            <g key={y}>
              <path d={`M${x} ${y} C ${x + side * 40} ${y - 30}, ${x + side * 90} ${y - 30}, ${x + side * 110} ${y - 10} C ${x + side * 80} ${y + 10}, ${x + side * 40} ${y + 10}, ${x} ${y} Z`} />
              <path d={`M${x} ${y} L ${x + side * 100} ${y - 12}`} strokeWidth="0.7" />
            </g>
          );
        })}
      </svg>
      {motes.map((m, i) => (
        <motion.span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-haldi/50"
          style={{ left: m.l, top: m.t }}
          animate={reduce ? undefined : { y: [0, -24, 0], opacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: m.d, repeat: Infinity, ease: "easeInOut", delay: i }}
        />
      ))}
    </div>
  );
}
