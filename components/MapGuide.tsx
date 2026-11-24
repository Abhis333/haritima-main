"use client";

import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import { Circle, CircleMarker, Polyline, useMap } from "react-leaflet";
import { Navigation, X } from "lucide-react";
import { useLang } from "@/lib/i18n/client";
import { bearing, compassIndex, googleDirectionsUrl, haversine, walkMinutes } from "@/lib/geo";

type Target = { latitude: number; longitude: number; name: string; isApproximate: boolean };
type Fix = { latitude: number; longitude: number; accuracy: number };
type GuideError = "denied" | "insecure" | "unavailable";
type Bounds = [[number, number], [number, number]];

const inside = (p: Fix, [[s, w], [n, e]]: Bounds) => p.latitude >= s && p.latitude <= n && p.longitude >= w && p.longitude <= e;

/** Watches the device position while `active`; stops watching when inactive or unmounted. */
export function useLiveLocation(active: boolean) {
  const [fix, setFix] = useState<Fix | null>(null);
  const [error, setError] = useState<GuideError | null>(null);
  useEffect(() => {
    if (!active) return;
    setFix(null);
    setError(null);
    if (!window.isSecureContext) return setError("insecure");
    if (!("geolocation" in navigator)) return setError("unavailable");
    const id = navigator.geolocation.watchPosition(
      (p) => { setFix({ latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy }); setError(null); },
      (e) => setError(e.code === e.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [active]);
  return { fix, error };
}

/** Inside MapContainer: your position, its accuracy circle, and a direction line to the target. Frames both once. */
export function GuideLayer({ fix, target, bounds }: { fix: Fix | null; target: Target; bounds: Bounds }) {
  const map = useMap();
  const framed = useRef(false);
  useEffect(() => {
    framed.current = false;
  }, [target]);
  useEffect(() => {
    if (!fix || framed.current || !inside(fix, bounds)) return;
    framed.current = true;
    map.fitBounds(L.latLngBounds([[fix.latitude, fix.longitude], [target.latitude, target.longitude]]), { padding: [60, 60], maxZoom: 19 });
  }, [fix, target, bounds, map]);
  if (!fix || !inside(fix, bounds)) return null;
  const me: [number, number] = [fix.latitude, fix.longitude];
  return (
    <>
      <Circle center={me} radius={fix.accuracy} pathOptions={{ color: "#2563EB", weight: 1, opacity: 0.4, fillOpacity: 0.08 }} />
      <Polyline positions={[me, [target.latitude, target.longitude]]} pathOptions={{ color: "#2563EB", weight: 3, dashArray: "2 8", lineCap: "round" }} />
      <CircleMarker center={me} radius={8} pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#2563EB", fillOpacity: 1 }} />
    </>
  );
}

/** Floating panel: direction, distance and time to the target, or why guiding can't run. */
export function GuidePanel({ fix, error, target, bounds, onStop }: { fix: Fix | null; error: GuideError | null; target: Target; bounds: Bounds; onStop: () => void }) {
  const { t } = useLang();
  let body: React.ReactNode;
  if (error) body = <p>{t.map[error]}</p>;
  else if (!fix) body = <p>{t.map.locating}</p>;
  else if (!inside(fix, bounds)) body = <p>{t.map.outside}</p>;
  else {
    const metres = haversine(fix, target);
    const arrived = metres <= Math.max(12, Math.min(fix.accuracy, 30));
    const deg = bearing(fix, target);
    body = arrived ? (
      <p className="font-medium text-forest">{t.map.arrived}</p>
    ) : (
      <>
        <p className="flex items-center gap-2 text-base font-semibold text-forest">
          <Navigation className="h-5 w-5 shrink-0 text-[#2563EB]" style={{ transform: `rotate(${deg - 45}deg)` }} aria-hidden="true" />
          {t.map.head} {t.map.dirs[compassIndex(deg)]}
        </p>
        <p className="tabular-nums">{Math.round(metres)} m {t.map.away} · ~{walkMinutes(metres)} {t.map.walk}</p>
        <p className="text-xs text-muted-foreground">{t.map.accuracy}: ±{Math.round(fix.accuracy)} m. {t.map.straightLine}</p>
      </>
    );
  }
  return (
    <div role="status" aria-live="polite" className="absolute bottom-3 left-3 right-3 z-[500] rounded-md border border-border bg-white/95 p-3 text-sm text-ink shadow-md sm:right-auto sm:w-80">
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{target.name}</p>
        <button type="button" onClick={onStop} aria-label={t.map.stopGuide} className="-m-1 rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
      </div>
      <div className="space-y-1">{body}</div>
      {target.isApproximate && <p className="mt-1 text-xs text-muted-foreground">{t.map.approxTarget}</p>}
      <a href={googleDirectionsUrl(target.latitude, target.longitude)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[13px] font-medium text-leaf hover:underline">
        {t.map.directions} (Google Maps) ↗
      </a>
    </div>
  );
}
