"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, useMap } from "react-leaflet";
import { LocateFixed, Navigation } from "lucide-react";
import { useLang } from "@/lib/i18n/client";
import { googleDirectionsUrl } from "@/lib/geo";
import { CAMPUS_MAP_PROPS, insideCampus } from "@/lib/campus";
import { PLACE_COLORS, type PlacePoint } from "@/lib/places";
import { Basemap } from "./map/Basemap";
import { placeIcon, plantPin } from "./map/markers";
import { FlyToMe, GuideLayer, GuidePanel, MeLayer, useLiveLocation, useWalkRoute, type GuideTarget } from "./MapGuide";

// Kept for existing imports (TrailMap and others); the values live in lib/campus.ts.
export { CAMPUS_BOUNDS, CAMPUS_CENTER, CAMPUS_MAP_PROPS } from "@/lib/campus";

export type MapPoint = {
  id: string;
  slug: string;
  commonName: string;
  hindiName: string | null;
  scientificName: string;
  description: string;
  imageUrl: string | null;
  category: string;
  categorySlug: string;
  color: string;
  latitude: number;
  longitude: number;
  campusArea: string;
  locationDescription: string | null;
  landmark: string | null;
  isApproximate: boolean;
};

function FitTo({ points, focus }: { points: MapPoint[]; focus?: MapPoint }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.setView([focus.latitude, focus.longitude], 18, { animate: true });
    else if (points.length > 1) map.fitBounds(L.latLngBounds(points.map((p) => [p.latitude, p.longitude])), { padding: [40, 40], maxZoom: 18 });
  }, [map, points, focus]);
  return null;
}

/** Closes the popup that contains the clicked button (after starting guidance from it). */
const closePopup = (el: HTMLElement) => el.closest(".leaflet-popup")?.querySelector<HTMLElement>(".leaflet-popup-close-button")?.click();

export default function PlantMap({ points, places = [], focusSlug, height = "70vh", interactive = true, autoGuide = false }: {
  points: MapPoint[];
  /** Temples, buildings, gates … shown with labelled icons (Admin → Campus places). */
  places?: PlacePoint[];
  focusSlug?: string;
  height?: string;
  interactive?: boolean;
  /** Start live guiding to `focusSlug` straight away (from the plant page's "Guide me" link). */
  autoGuide?: boolean;
}) {
  const { t } = useLang();
  const [category, setCategory] = useState("");
  const [showPlaces, setShowPlaces] = useState(true);
  const [showMe, setShowMe] = useState(false);
  // "plant:<locationId>" or "place:<placeId>"
  const [guideKey, setGuideKey] = useState<string | undefined>(() => {
    const id = autoGuide ? points.find((p) => p.slug === focusSlug)?.id : undefined;
    return id ? `plant:${id}` : undefined;
  });

  const target: GuideTarget | null = useMemo(() => {
    if (!guideKey) return null;
    const [kind, id] = guideKey.split(":");
    if (kind === "plant") {
      const p = points.find((x) => x.id === id);
      return p ? { key: guideKey, latitude: p.latitude, longitude: p.longitude, name: p.commonName, approxNote: p.isApproximate ? t.map.approxTarget : null } : null;
    }
    const pl = places.find((x) => x.id === id);
    return pl ? { key: guideKey, latitude: pl.latitude, longitude: pl.longitude, name: pl.name, approxNote: pl.isApproximate ? t.map.approxPlace : null } : null;
  }, [guideKey, points, places, t]);

  const live = useLiveLocation(Boolean(target) || showMe);
  const walk = useWalkRoute(target ? live.fix : null, target);

  const legend = useMemo(() => {
    const m = new Map<string, { name: string; color: string; count: number }>();
    points.forEach((p) => {
      const c = m.get(p.categorySlug);
      if (c) c.count++;
      else m.set(p.categorySlug, { name: p.category, color: p.color, count: 1 });
    });
    return [...m.entries()];
  }, [points]);
  const visible = category ? points.filter((p) => p.categorySlug === category) : points;
  const focus = points.find((p) => p.slug === focusSlug);
  const meOutside = showMe && !target && live.fix && !insideCampus(live.fix.latitude, live.fix.longitude);
  const meMessage = showMe && !target ? (live.error ? t.map[live.error] : meOutside ? t.map.outsideShort : null) : null;

  const actions = (lat: number, lng: number, key: string) =>
    interactive && (
      <div className="flex flex-wrap gap-2 border-t border-border pt-2">
        <button
          type="button"
          onClick={(e) => { setGuideKey(key); closePopup(e.currentTarget); }}
          className="inline-flex items-center gap-1 rounded-md bg-forest px-2.5 py-1.5 text-[12px] font-medium text-white hover:bg-forest-deep"
        >
          <Navigation className="h-3.5 w-3.5" aria-hidden="true" /> {t.map.guide}
        </button>
        <a
          href={googleDirectionsUrl(lat, lng)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-md border border-border px-2.5 py-1.5 text-[12px] font-medium text-forest hover:bg-muted"
        >
          {t.map.directions} ↗
        </a>
      </div>
    );

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card shadow-sm" style={{ height }}>
      <MapContainer {...CAMPUS_MAP_PROPS} scrollWheelZoom={interactive} dragging={interactive} className="h-full w-full" aria-label={t.map.title}>
        <Basemap />
        <FitTo points={visible} focus={focus} />
        {target && <GuideLayer fix={live.fix} target={target} route={walk.route} />}
        <MeLayer fix={live.fix} />
        {showMe && !target && <FlyToMe fix={live.fix} />}

        {showPlaces && places.map((pl) => (
          <Marker key={pl.id} position={[pl.latitude, pl.longitude]} icon={placeIcon(pl.kind, pl.name)} title={pl.name} keyboard zIndexOffset={-100}>
            <Popup maxWidth={260} minWidth={220}>
              <div>
                {pl.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pl.imageUrl} alt={pl.name} loading="lazy" className="block h-32 w-full object-cover" />
                )}
                <div className="space-y-2 p-3.5">
                  <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ background: PLACE_COLORS[pl.kind] }} />
                    {t.map.placeKinds[pl.kind]}
                  </div>
                  <p className="m-0 text-[15px] font-semibold leading-snug text-forest">
                    {pl.name} {pl.altName && <span className="deva font-normal text-ink/70">· {pl.altName}</span>}
                  </p>
                  {pl.description && <p className="m-0 line-clamp-4 text-[13px] leading-relaxed text-ink/85">{pl.description}</p>}
                  {pl.isApproximate && <p className="m-0 text-[12px] text-muted-foreground">{t.map.approxPlace}</p>}
                  {actions(pl.latitude, pl.longitude, `place:${pl.id}`)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {visible.map((p) => (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={plantPin(p.color, p.isApproximate, p.slug === focusSlug)}
            title={p.commonName}
            keyboard
            eventHandlers={p.slug === focusSlug && !autoGuide ? { add: (e) => setTimeout(() => e.target.openPopup(), 400) } : undefined}
          >
            <Popup maxWidth={260} minWidth={220}>
              <div>
                {p.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.commonName} loading="lazy" className="block h-32 w-full object-cover" />
                )}
                <div className="space-y-2 p-3.5">
                  <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                    {p.category}
                  </div>
                  <div>
                    <p className="m-0 text-[15px] font-semibold leading-snug text-forest">
                      {p.commonName} {p.hindiName && <span className="deva font-normal text-ink/70">· {p.hindiName}</span>}
                    </p>
                    <p className="m-0 text-[13px] italic text-muted-foreground">{p.scientificName}</p>
                  </div>
                  <p className="m-0 line-clamp-3 text-[13px] leading-relaxed text-ink/85">{p.description}</p>
                  <div className="border-t border-border pt-2 text-[12px] text-ink/80">
                    <span className="font-medium text-ink">{t.map.location}:</span> {p.campusArea}
                    {p.locationDescription ? `, ${p.locationDescription}` : ""}
                    {p.isApproximate && <span className="ml-1 text-muted-foreground">({t.map.approximate})</span>}
                  </div>
                  <Link href={`/plants/${p.slug}`} className="inline-block text-[13px] font-medium text-leaf hover:underline">
                    {t.map.viewPlant} →
                  </Link>
                  {actions(p.latitude, p.longitude, `plant:${p.id}`)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {target && (
        <GuidePanel fix={live.fix} error={live.error} target={target} route={walk.route} routeStatus={walk.status} onStop={() => setGuideKey(undefined)} />
      )}

      {interactive && (
        <div className={`absolute right-3 z-[450] flex flex-col items-end gap-2 ${target ? "bottom-3 max-sm:bottom-auto max-sm:top-3 max-sm:right-auto max-sm:left-14" : "bottom-8"}`}>
          {meMessage && <p role="status" className="max-w-56 rounded-md bg-white/95 px-3 py-2 text-[12px] text-ink shadow-md">{meMessage}</p>}
          <button
            type="button"
            onClick={() => setShowMe((v) => !v)}
            aria-pressed={showMe || Boolean(target)}
            aria-label={showMe ? t.map.hideLocation : t.map.myLocation}
            title={showMe ? t.map.hideLocation : t.map.myLocation}
            className={`grid h-10 w-10 place-items-center rounded-full border border-border bg-white shadow-md hover:bg-muted ${showMe || target ? "text-[#1A73E8]" : "text-ink/70"}`}
          >
            <LocateFixed className="h-5 w-5" />
          </button>
        </div>
      )}

      {interactive && legend.length > 0 && (
        <div className="absolute right-3 top-3 z-[400] max-h-[calc(100%-5rem)] w-56 max-w-[calc(100%-4.5rem)] overflow-y-auto rounded-md border border-border bg-white/95 text-ink shadow-md">
          <p className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t.map.legend}</p>
          <ul className="py-1">
            {[["", { name: t.plants.all, color: "", count: points.length }] as const, ...legend].map(([slug, c]) => {
              const active = category === slug;
              return (
                <li key={slug || "all"}>
                  <button
                    type="button"
                    onClick={() => setCategory(active && slug ? "" : slug)}
                    aria-pressed={active}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] transition-colors hover:bg-muted ${active ? "bg-accent font-medium text-forest" : ""}`}
                  >
                    {c.color ? (
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white" style={{ background: c.color }} />
                    ) : (
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-ink/40" />
                    )}
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="tabular-nums text-muted-foreground">{c.count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {places.length > 0 && (
            <label className="flex cursor-pointer items-center gap-2 border-t border-border px-3 py-2 text-[13px]">
              <input type="checkbox" checked={showPlaces} onChange={(e) => setShowPlaces(e.target.checked)} className="h-3.5 w-3.5 accent-forest" />
              <span className="flex-1">{t.map.showPlaces}</span>
              <span className="tabular-nums text-muted-foreground">{places.length}</span>
            </label>
          )}
          <p className="flex items-center gap-2 border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-dashed border-ink/60" /> {t.map.approximateNote}
          </p>
        </div>
      )}
    </div>
  );
}
