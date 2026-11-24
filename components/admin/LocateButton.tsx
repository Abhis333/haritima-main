"use client";

import { useRef, useState } from "react";
import { Crosshair, Loader2 } from "lucide-react";
import { Button } from "../ui/button";

// Readings this accurate count as a GPS survey, so "approximate" is unticked automatically.
const SURVEY_ACCURACY_M = 20;
const WATCH_MS = 15_000;

/**
 * Fills the surrounding form's latitude/longitude inputs from the device GPS.
 * Watches for up to 15 s and keeps the most accurate reading, since phones improve after the first fix.
 */
export function LocateButton() {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function fill(pos: GeolocationPosition) {
    const form = ref.current?.closest("form");
    if (!form) return;
    const set = (name: string, value: string) => {
      const el = form.elements.namedItem(name);
      if (el instanceof HTMLInputElement) el.value = value;
    };
    set("latitude", pos.coords.latitude.toFixed(6));
    set("longitude", pos.coords.longitude.toFixed(6));
    const accuracy = Math.round(pos.coords.accuracy);
    const approx = form.elements.namedItem("isApproximate");
    const surveyed = accuracy <= SURVEY_ACCURACY_M;
    if (approx instanceof HTMLInputElement) approx.checked = !surveyed;
    // Seed rows carry a "(approximate — to be confirmed with GPS)" note; drop it once the point is surveyed.
    const desc = form.elements.namedItem("locationDescription");
    if (surveyed && desc instanceof HTMLInputElement) desc.value = desc.value.replace(/\s*\(approximate[^)]*\)\s*$/i, "");
    setMsg(
      surveyed
        ? `Location filled (±${accuracy} m). “Approximate” was unticked. Check the area name and description, then Save.`
        : `Location filled, but accuracy is only ±${accuracy} m, so it stays marked approximate. Move into open sky and try again.`,
    );
  }

  function locate() {
    if (!window.isSecureContext) return setMsg("Location needs HTTPS (or localhost). Open the deployed site on your phone.");
    if (!("geolocation" in navigator)) return setMsg("This browser cannot share its location.");
    setBusy(true);
    setMsg("Getting a GPS fix… stand next to the plant.");
    let best: GeolocationPosition | null = null;
    const finish = () => {
      navigator.geolocation.clearWatch(watch);
      clearTimeout(timer);
      setBusy(false);
      if (best) fill(best);
    };
    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        if (!best || pos.coords.accuracy < best.coords.accuracy) best = pos;
        setMsg(`Best reading so far: ±${Math.round(best.coords.accuracy)} m…`);
        if (best.coords.accuracy <= 10) finish();
      },
      (err) => {
        navigator.geolocation.clearWatch(watch);
        clearTimeout(timer);
        setBusy(false);
        setMsg(err.code === err.PERMISSION_DENIED ? "Location permission was denied. Allow it in the browser settings." : "Could not get a location. Try again outdoors.");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: WATCH_MS },
    );
    const timer = setTimeout(finish, WATCH_MS);
  }

  return (
    <div ref={ref} className="mt-4 flex flex-wrap items-center gap-3">
      <Button type="button" variant="outline" onClick={locate} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <Crosshair />} Use my current location
      </Button>
      {msg && <p role="status" className="text-sm text-muted-foreground">{msg}</p>}
    </div>
  );
}
