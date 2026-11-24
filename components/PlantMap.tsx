"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { Navigation } from "lucide-react";
import { useLang } from "@/lib/i18n/client";
import { googleDirectionsUrl } from "@/lib/geo";
import { GuideLayer, GuidePanel, useLiveLocation } from "./MapGuide";

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

// DSVV campus centre, Haridwar (Wikipedia: 29°59′53″N 78°11′34″E). Replace with a surveyed point if needed.
export const CAMPUS_CENTER: [number, number] = [
  Number(process.env.NEXT_PUBLIC_CAMPUS_LAT ?? 29.998143),
  Number(process.env.NEXT_PUBLIC_CAMPUS_LNG ?? 78.192779),
];

// Box of roughly 650 m each way around the campus centre. The maps can't be panned or zoomed out past it,
// and no tiles load outside it, so only the DSVV campus is shown. Widen the offsets if a plant falls outside.
export const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [CAMPUS_CENTER[0] - 0.006, CAMPUS_CENTER[1] - 0.0068],
  [CAMPUS_CENTER[0] + 0.006, CAMPUS_CENTER[1] + 0.0068],
];
/** Shared MapContainer props that keep a map on campus. */
export const CAMPUS_MAP_PROPS = { center: CAMPUS_CENTER, zoom: 17, minZoom: 16, maxZoom: 19, maxBounds: CAMPUS_BOUNDS, maxBoundsViscosity: 1 } as const;

// Muted basemap so the plant markers carry the colour. Free with attribution, no key.
const DEFAULT_TILES = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const DEFAULT_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
const CUSTOM_TILES = process.env.NEXT_PUBLIC_MAP_URL;
export const TILE_URL = CUSTOM_TILES || DEFAULT_TILES;
export const TILE_ATTRIBUTION = CUSTOM_TILES
  ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  : DEFAULT_ATTRIBUTION;

// Plain circular marker; approximate locations get a dashed ring.
function pin(color: string, approximate: boolean, focused: boolean) {
  const size = focused ? 22 : 16;
  const r = size / 2 - 2;
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true" style="filter:drop-shadow(0 1px 1.5px rgb(0 0 0 / .35))">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="${color}" stroke="#ffffff" stroke-width="2" ${approximate ? 'stroke-dasharray="2.5 2"' : ""}/></svg>`,
  });
}

function FitTo({ points, focus }: { points: MapPoint[]; focus?: MapPoint }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.setView([focus.latitude, focus.longitude], 18, { animate: true });
    else if (points.length > 1) map.fitBounds(L.latLngBounds(points.map((p) => [p.latitude, p.longitude])), { padding: [40, 40], maxZoom: 18 });
  }, [map, points, focus]);
  return null;
}

export default function PlantMap({ points, focusSlug, height = "70vh", interactive = true, autoGuide = false }: {
  points: MapPoint[];
  focusSlug?: string;
  height?: string;
  interactive?: boolean;
  /** Start live guiding to `focusSlug` straight away (from the plant page's "Guide me" link). */
  autoGuide?: boolean;
}) {
  const { t } = useLang();
  const [category, setCategory] = useState("");
  const [guideId, setGuideId] = useState<string | undefined>(() => (autoGuide ? points.find((p) => p.slug === focusSlug)?.id : undefined));
  const guideTo = points.find((p) => p.id === guideId);
  const live = useLiveLocation(Boolean(guideTo));
  const guideTarget = guideTo && { latitude: guideTo.latitude, longitude: guideTo.longitude, name: guideTo.commonName, isApproximate: guideTo.isApproximate };
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
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card shadow-sm" style={{ height }}>
      <MapContainer {...CAMPUS_MAP_PROPS} scrollWheelZoom={interactive} dragging={interactive} className="h-full w-full" aria-label={t.map.title}>
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} maxZoom={19} bounds={CAMPUS_BOUNDS} />
        <FitTo points={visible} focus={focus} />
        {guideTarget && <GuideLayer fix={live.fix} target={guideTarget} bounds={CAMPUS_BOUNDS} />}
        {visible.map((p) => (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={pin(p.color, p.isApproximate, p.slug === focusSlug)}
            title={p.commonName}
            keyboard
            eventHandlers={p.slug === focusSlug ? { add: (e) => setTimeout(() => e.target.openPopup(), 400) } : undefined}
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
                  {interactive && (
                    <div className="flex flex-wrap gap-2 border-t border-border pt-2">
                      <button
                        type="button"
                        onClick={(e) => { setGuideId(p.id); e.currentTarget.closest(".leaflet-popup")?.querySelector<HTMLElement>(".leaflet-popup-close-button")?.click(); }}
                        className="inline-flex items-center gap-1 rounded-md bg-forest px-2.5 py-1.5 text-[12px] font-medium text-white hover:bg-forest-deep"
                      >
                        <Navigation className="h-3.5 w-3.5" aria-hidden="true" /> {t.map.guide}
                      </button>
                      <a
                        href={googleDirectionsUrl(p.latitude, p.longitude)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-md border border-border px-2.5 py-1.5 text-[12px] font-medium text-forest hover:bg-muted"
                      >
                        {t.map.directions} ↗
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {guideTarget && (
        <GuidePanel fix={live.fix} error={live.error} target={guideTarget} bounds={CAMPUS_BOUNDS} onStop={() => setGuideId(undefined)} />
      )}

      {interactive && legend.length > 0 && (
        <div className="absolute right-3 top-3 z-[400] max-h-[calc(100%-1.5rem)] w-56 max-w-[calc(100%-4.5rem)] overflow-y-auto rounded-md border border-border bg-white/95 text-ink shadow-md">
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
          <p className="flex items-center gap-2 border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-dashed border-ink/60" /> {t.map.approximateNote}
          </p>
        </div>
      )}
    </div>
  );
}
