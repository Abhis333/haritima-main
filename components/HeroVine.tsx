"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * The hero's one orchestrated moment: the shirorekha (the headline bar of Devanagari)
 * continues past the wordmark as a branch, and leaves unfurl along it once on load.
 */
export function HeroVine({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const leaves = [
    { x: 250, y: 42, r: -35, d: 0.9 },
    { x: 330, y: 30, r: 30, d: 1.1 },
    { x: 420, y: 44, r: -25, d: 1.3 },
    { x: 505, y: 26, r: 40, d: 1.5 },
    { x: 585, y: 38, r: -20, d: 1.7 },
  ];
  return (
    <svg viewBox="0 0 640 80" className={className} aria-hidden fill="none">
      <motion.path
        d="M0 36 H 180 C 260 36, 300 40, 360 36 S 470 30, 520 32 S 600 36, 636 30"
        stroke="#173a2b"
        strokeWidth="2.2"
        strokeLinecap="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.8, ease: [0.3, 0.7, 0.2, 1], delay: 0.2 }}
      />
      {leaves.map((l, i) => (
        <motion.g
          key={i}
          style={{ originX: `${l.x}px`, originY: `${l.y}px` }}
          initial={reduce ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: l.d, duration: 0.6, ease: "backOut" }}
        >
          <path
            transform={`translate(${l.x} ${l.y}) rotate(${l.r})`}
            d="M0 0 C 8 -14, 22 -16, 30 -12 C 24 -2, 12 4, 0 0 Z"
            fill={i % 2 ? "#93a86e" : "#4e7a3a"}
          />
        </motion.g>
      ))}
      <motion.circle
        cx="636"
        cy="30"
        r="4"
        fill="#b8892e"
        initial={reduce ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.9, duration: 0.4 }}
      />
    </svg>
  );
}
