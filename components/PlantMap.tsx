"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { useLang } from "@/lib/i18n/client";

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

// Approximate centre of the DSVV / Shantikunj campus, Haridwar. Replace with a surveyed point if needed.
export const CAMPUS_CENTER: [number, number] = [
  Number(process.env.NEXT_PUBLIC_CAMPUS_LAT ?? 29.9985),
  Number(process.env.NEXT_PUBLIC_CAMPUS_LNG ?? 78.1985),
];

function pin(color: string, approximate: boolean, focused: boolean) {
  const size = focused ? 38 : 30;
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4],
    html: `<svg width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 2C23 6 26 14 16 30 6 14 9 6 16 2Z" fill="${color}" stroke="#faf5ea" stroke-width="2" ${approximate ? 'stroke-dasharray="3 2"' : ""}/>
      <circle cx="16" cy="12" r="3.2" fill="#faf5ea"/></svg>`,
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

export default function PlantMap({ points, focusSlug, height = "70vh", interactive = true }: { points: MapPoint[]; focusSlug?: string; height?: string; interactive?: boolean }) {
  const { t } = useLang();
  const [category, setCategory] = useState("");
  const legend = useMemo(() => {
    const m = new Map<string, { name: string; color: string }>();
    points.forEach((p) => m.set(p.categorySlug, { name: p.category, color: p.color }));
    return [...m.entries()];
  }, [points]);
  const visible = category ? points.filter((p) => p.categorySlug === category) : points;
  const focus = points.find((p) => p.slug === focusSlug);
  const tiles = process.env.NEXT_PUBLIC_MAP_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <div className="relative overflow-hidden rounded-xl border border-parch" style={{ height }}>
      <MapContainer center={CAMPUS_CENTER} zoom={16} maxZoom={19} scrollWheelZoom={interactive} dragging={interactive} className="h-full w-full" aria-label={t.map.title}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url={tiles} maxZoom={19} />
        <FitTo points={visible} focus={focus} />
        {visible.map((p) => (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={pin(p.color, p.isApproximate, p.slug === focusSlug)}
            title={p.commonName}
            keyboard
            eventHandlers={p.slug === focusSlug ? { add: (e) => setTimeout(() => e.target.openPopup(), 400) } : undefined}
          >
            <Popup maxWidth={260}>
              <div className="space-y-1.5">
                {p.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.commonName} loading="lazy" className="mb-1 h-28 w-full rounded-md object-cover" />
                )}
                <p className="m-0 text-base font-semibold text-forest">
                  {p.commonName} {p.hindiName && <span className="deva font-normal">· {p.hindiName}</span>}
                </p>
                <p className="m-0 text-sm italic text-muted-foreground">{p.scientificName}</p>
                <p className="m-0 text-xs text-leaf">{p.category}</p>
                <p className="m-0 line-clamp-3 text-sm">{p.description}</p>
                <p className="m-0 text-sm">
                  📍 {p.campusArea}
                  {p.locationDescription ? ` — ${p.locationDescription}` : ""}
                  {p.isApproximate && <em className="text-[#7a5a14]"> ({t.map.approximate})</em>}
                </p>
                <Link href={`/plants/${p.slug}`} className="inline-block pt-1 text-sm font-medium text-leaf underline">
                  {t.map.viewPlant}
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {interactive && legend.length > 0 && (
        <div className="glass absolute bottom-3 left-3 z-[400] max-w-[calc(100%-1.5rem)] rounded-lg p-3 shadow">
          <p className="mb-2 text-sm font-medium text-forest">{t.map.legend}</p>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setCategory("")} aria-pressed={!category} className={`rounded-full border px-2.5 py-1 text-xs ${!category ? "border-forest bg-forest text-sandal" : "border-parch bg-white/60"}`}>
              {t.plants.all}
            </button>
            {legend.map(([slug, c]) => (
              <button
                key={slug}
                type="button"
                onClick={() => setCategory(slug === category ? "" : slug)}
                aria-pressed={category === slug}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${category === slug ? "border-forest bg-forest text-sandal" : "border-parch bg-white/60"}`}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} /> {c.name}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            <span className="inline-block h-2.5 w-2.5 rounded-full border border-dashed border-bark align-middle" /> = {t.map.approximate}
          </p>
        </div>
      )}
    </div>
  );
}
