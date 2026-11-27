"use client";

import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import { Circle, CircleMarker, Polyline, useMap } from "react-leaflet";
import { CornerUpLeft, CornerUpRight, MoveUp, Navigation, RotateCcw, X } from "lucide-react";
import { useLang } from "@/lib/i18n/client";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { bearing, compassIndex, googleDirectionsUrl, haversine, walkMinutes } from "@/lib/geo";
import { insideCampus } from "@/lib/campus";
import { nearestIndex, routeProgress, type RouteStep, type WalkRoute } from "@/lib/route";

export type GuideTarget = { key: string; latitude: number; longitude: number; name: string; approxNote: string | null };
export type Fix = { latitude: number; longitude: number; accuracy: number };
type GuideError = "denied" | "insecure" | "unavailable";
type RouteStatus = "idle" | "loading" | "ok" | "failed";

// Leave the route by more than this and a new one is requested (at most every 15 s).
const REROUTE_M = 30;
const REROUTE_MS = 15_000;
// After a failed request, wait before trying again; guidance meanwhile shows the straight line.
const RETRY_MS = 30_000;

const onCampus = (f: Fix) => insideCampus(f.latitude, f.longitude);
const arrivedAt = (fix: Fix, target: GuideTarget) => haversine(fix, target) <= Math.max(12, Math.min(fix.accuracy, 30));

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

/**
 * Walking route from the live position to the target along mapped paths (via /api/walk-route).
 * Requested once on the first on-campus fix, again when the walker strays from it; failures fall back to the straight line.
 */
export function useWalkRoute(fix: Fix | null, target: GuideTarget | null) {
  const [route, setRoute] = useState<WalkRoute | null>(null);
  const [status, setStatus] = useState<RouteStatus>("idle");
  const lastRequest = useRef(0);
  const inFlight = useRef(false);
  const currentKey = useRef<string | null>(null);
  const key = target?.key ?? null;

  useEffect(() => {
    currentKey.current = key;
    setRoute(null);
    setStatus("idle");
    lastRequest.current = 0;
  }, [key]);

  useEffect(() => {
    if (!fix || !target || !onCampus(fix) || inFlight.current || arrivedAt(fix, target)) return;
    const since = Date.now() - lastRequest.current;
    const due = route
      ? nearestIndex(route.path, [fix.latitude, fix.longitude]).offRoute > REROUTE_M && since > REROUTE_MS
      : status !== "failed" || since > RETRY_MS;
    if (!due) return;
    inFlight.current = true;
    lastRequest.current = Date.now();
    const requestKey = target.key;
    if (!route) setStatus("loading");
    const q = new URLSearchParams({ from: `${fix.latitude},${fix.longitude}`, to: `${target.latitude},${target.longitude}` });
    fetch(`/api/walk-route?${q}`)
      .then((r) => (r.ok ? (r.json() as Promise<WalkRoute>) : Promise.reject(new Error(String(r.status)))))
      .then((r) => {
        if (currentKey.current !== requestKey) return;
        setRoute(r);
        setStatus("ok");
      })
      .catch(() => {
        if (currentKey.current === requestKey && !route) setStatus("failed");
      })
      .finally(() => { inFlight.current = false; });
  }, [fix, target, route, status]);

  return { route, status };
}

/** Your position with its accuracy circle (only drawn on the campus map). */
export function MeLayer({ fix }: { fix: Fix | null }) {
  if (!fix || !onCampus(fix)) return null;
  const me: [number, number] = [fix.latitude, fix.longitude];
  return (
    <>
      <Circle center={me} radius={fix.accuracy} pathOptions={{ color: "#2563EB", weight: 1, opacity: 0.4, fillOpacity: 0.08 }} interactive={false} />
      <CircleMarker center={me} radius={8} pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#2563EB", fillOpacity: 1 }} interactive={false} />
    </>
  );
}

/** Moves the map to your position once, when "Show my location" gets its first on-campus fix. */
export function FlyToMe({ fix }: { fix: Fix | null }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (!fix || done.current || !onCampus(fix)) return;
    done.current = true;
    map.flyTo([fix.latitude, fix.longitude], Math.max(map.getZoom(), 18), { duration: 0.8 });
  }, [fix, map]);
  return null;
}

/** Inside MapContainer: the walking route (or a straight direction line) to the target. Frames you and the target once. */
export function GuideLayer({ fix, target, route }: { fix: Fix | null; target: GuideTarget; route: WalkRoute | null }) {
  const map = useMap();
  const framed = useRef<string | null>(null);
  useEffect(() => {
    if (!fix || framed.current === target.key || !onCampus(fix)) return;
    framed.current = target.key;
    map.fitBounds(L.latLngBounds([[fix.latitude, fix.longitude], [target.latitude, target.longitude]]), { padding: [70, 70], maxZoom: 19 });
  }, [fix, target, map]);
  if (!fix || !onCampus(fix)) return null;
  const me: [number, number] = [fix.latitude, fix.longitude];
  const goal: [number, number] = [target.latitude, target.longitude];
  const dashed = { color: "#2563EB", weight: 3, dashArray: "2 8", lineCap: "round" as const };
  if (!route) return <Polyline positions={[me, goal]} pathOptions={dashed} interactive={false} />;
  const { index } = nearestIndex(route.path, me);
  const ahead = route.path.slice(index);
  return (
    <>
      {/* Google-style route: white casing under a blue line; dotted links to the path at both ends. */}
      <Polyline positions={ahead} pathOptions={{ color: "#ffffff", weight: 9, opacity: 0.95, lineCap: "round", lineJoin: "round" }} interactive={false} />
      <Polyline positions={ahead} pathOptions={{ color: "#1A73E8", weight: 5, opacity: 1, lineCap: "round", lineJoin: "round" }} interactive={false} />
      <Polyline positions={[me, ahead[0]]} pathOptions={dashed} interactive={false} />
      <Polyline positions={[ahead[ahead.length - 1], goal]} pathOptions={dashed} interactive={false} />
    </>
  );
}

/** Instruction text for one maneuver, e.g. "Turn right onto Library Road". */
export function stepText(step: RouteStep, t: Dictionary) {
  const m = step.modifier;
  const turn = t.map.turn;
  let text: string;
  if (step.type === "arrive") return turn.arrive;
  if (step.type === "depart") text = turn.depart;
  else if (step.type === "roundabout" || step.type === "rotary") text = turn.roundabout;
  else if (m === "uturn") text = turn.uturn;
  else if (m === "sharp left") text = turn.sharpLeft;
  else if (m === "sharp right") text = turn.sharpRight;
  else if (m === "slight left") text = turn.slightLeft;
  else if (m === "slight right") text = turn.slightRight;
  else if (m === "left") text = turn.left;
  else if (m === "right") text = turn.right;
  else text = turn.straight;
  return step.name ? `${text} ${t.map.onto.replace("{name}", step.name)}` : text;
}

function StepIcon({ step }: { step: RouteStep | null }) {
  const cls = "h-6 w-6 shrink-0 text-[#1A73E8]";
  const m = step?.modifier ?? "";
  if (m === "uturn") return <RotateCcw className={cls} aria-hidden="true" />;
  if (m.includes("left")) return <CornerUpLeft className={cls} aria-hidden="true" />;
  if (m.includes("right")) return <CornerUpRight className={cls} aria-hidden="true" />;
  return <MoveUp className={cls} aria-hidden="true" />;
}

/** Floating panel: next turn, distance and time along the route (or direction when there is no route), or why guiding can't run. */
export function GuidePanel({ fix, error, target, route, routeStatus, onStop }: {
  fix: Fix | null;
  error: GuideError | null;
  target: GuideTarget;
  route: WalkRoute | null;
  routeStatus: RouteStatus;
  onStop: () => void;
}) {
  const { t } = useLang();
  const metresText = (m: number) => t.map.inMetres.replace("{m}", String(Math.max(5, Math.round(m / 5) * 5)));
  let body: React.ReactNode;
  if (error) body = <p>{t.map[error]}</p>;
  else if (!fix) body = <p>{t.map.locating}</p>;
  else if (!onCampus(fix)) body = <p>{t.map.outside}</p>;
  else if (arrivedAt(fix, target)) body = <p className="font-medium text-forest">{t.map.arrived}</p>;
  else if (route) {
    const p = routeProgress(route, [fix.latitude, fix.longitude], [target.latitude, target.longitude]);
    const upcoming = route.steps.filter((s) => s.at > nearestIndex(route.path, [fix.latitude, fix.longitude]).index && s.type !== "depart");
    body = (
      <>
        <div className="flex items-center gap-3">
          <StepIcon step={p.next} />
          <div>
            <p className="text-base font-semibold leading-snug text-forest">{p.next ? stepText(p.next, t) : t.map.turn.arrive}</p>
            <p className="tabular-nums text-muted-foreground">{metresText(p.toNext)}</p>
          </div>
        </div>
        <p className="tabular-nums">{Math.round(p.remaining)} m {t.map.away} · ~{walkMinutes(p.remaining)} {t.map.walk}</p>
        <p className="text-xs text-muted-foreground">{t.map.accuracy}: ±{Math.round(fix.accuracy)} m. {t.map.routeNote}</p>
        {upcoming.length > 1 && (
          <details className="text-[13px]">
            <summary className="cursor-pointer font-medium text-leaf">{t.map.allSteps} ({upcoming.length})</summary>
            <ol className="mt-1 max-h-32 list-decimal space-y-0.5 overflow-y-auto pl-5">
              {upcoming.map((s, i) => <li key={`${s.at}-${i}`}>{stepText(s, t)}</li>)}
            </ol>
          </details>
        )}
      </>
    );
  } else {
    const metres = haversine(fix, target);
    const deg = bearing(fix, target);
    body = (
      <>
        <p className="flex items-center gap-2 text-base font-semibold text-forest">
          <Navigation className="h-5 w-5 shrink-0 text-[#2563EB]" style={{ transform: `rotate(${deg - 45}deg)` }} aria-hidden="true" />
          {t.map.head} {t.map.dirs[compassIndex(deg)]}
        </p>
        <p className="tabular-nums">{Math.round(metres)} m {t.map.away} · ~{walkMinutes(metres)} {t.map.walk}</p>
        <p className="text-xs text-muted-foreground">
          {t.map.accuracy}: ±{Math.round(fix.accuracy)} m. {routeStatus === "loading" ? t.map.findingRoute : t.map.straightLine}
        </p>
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
      {target.approxNote && <p className="mt-1 text-xs text-muted-foreground">{target.approxNote}</p>}
      <div className="mt-2 flex items-center justify-between gap-2">
        <a href={googleDirectionsUrl(target.latitude, target.longitude)} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-leaf hover:underline">
          {t.map.directions} (Google Maps) ↗
        </a>
        {route && <span className="text-[10px] text-muted-foreground">{t.map.routeBy}</span>}
      </div>
    </div>
  );
}
