"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect } from "react";
import { MapContainer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import { useLang } from "@/lib/i18n/client";
import { CAMPUS_MAP_PROPS } from "@/lib/campus";
import { Basemap } from "./map/Basemap";
import type { TrailStopPoint } from "@/lib/trails";

// Numbered stop marker; approximate locations get a dashed ring like on the main map.
function numbered(n: number, color: string, approximate: boolean) {
  return L.divIcon({
    className: "",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
    html: `<div style="width:26px;height:26px;border-radius:50%;background:${color};color:#fff;font:600 12px/22px system-ui,sans-serif;text-align:center;border:2px ${approximate ? "dashed" : "solid"} #fff;box-shadow:0 1px 3px rgb(0 0 0/.4)">${n}</div>`,
  });
}

function Fit({ stops }: { stops: TrailStopPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (stops.length > 1) map.fitBounds(L.latLngBounds(stops.map((s) => [s.latitude, s.longitude])), { padding: [36, 36], maxZoom: 18 });
    else if (stops.length === 1) map.setView([stops[0].latitude, stops[0].longitude], 18);
  }, [map, stops]);
  return null;
}

export default function TrailMap({ stops, color, height = "60vh" }: { stops: TrailStopPoint[]; color: string; height?: string }) {
  const { t } = useLang();
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card shadow-sm" style={{ height }}>
      <MapContainer {...CAMPUS_MAP_PROPS} className="h-full w-full" aria-label={t.trails.route}>
        <Basemap />
        <Fit stops={stops} />
        <Polyline positions={stops.map((s) => [s.latitude, s.longitude])} pathOptions={{ color, weight: 3, opacity: 0.85, dashArray: "6 6" }} />
        {stops.map((s, i) => (
          <Marker key={s.id} position={[s.latitude, s.longitude]} icon={numbered(i + 1, color, s.isApproximate)} title={`${i + 1}. ${s.name}`} keyboard>
            <Popup maxWidth={240} minWidth={200}>
              <div className="space-y-1.5 p-3.5">
                <p className="m-0 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t.trails.stop} {i + 1}</p>
                <p className="m-0 text-[15px] font-semibold text-forest">{s.name}</p>
                <p className="m-0 text-[13px] italic text-muted-foreground">{s.scientificName}</p>
                {s.note && <p className="m-0 text-[13px] leading-relaxed">{s.note}</p>}
                <Link href={`/plants/${s.slug}`} className="inline-block text-[13px] font-medium text-leaf hover:underline">{t.trails.viewPlant} →</Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
