"use client";

import { useEffect } from "react";

/** Counts one view per plant per browser session (sessionStorage), so reloads and back-navigation don't inflate it. */
export function ViewBeacon({ plantId }: { plantId: string }) {
  useEffect(() => {
    const key = `haritima-viewed:${plantId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked (private mode): still count the view.
    }
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plantId }),
      keepalive: true,
    }).catch(() => {});
  }, [plantId]);
  return null;
}
