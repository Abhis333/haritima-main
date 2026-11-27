import L from "leaflet";
import { PLACE_COLORS, type PlaceKind } from "@/lib/places";

// Google-style teardrop pin in the category colour. Approximate (unsurveyed) spots get a dashed outline.
export function plantPin(color: string, approximate: boolean, focused: boolean) {
  const w = focused ? 34 : 26;
  const h = Math.round(w * 1.38);
  return L.divIcon({
    className: "",
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
    popupAnchor: [0, -h + 6],
    html: `<svg width="${w}" height="${h}" viewBox="0 0 26 36" aria-hidden="true" style="filter:drop-shadow(0 2px 2px rgb(0 0 0 / .35))">
      <path d="M13 1C6.4 1 1 6.3 1 12.9 1 21.8 13 35 13 35s12-13.2 12-22.1C25 6.3 19.6 1 13 1z" fill="${color}" stroke="#ffffff" stroke-width="1.6" ${approximate ? 'stroke-dasharray="3 2"' : ""}/>
      <circle cx="13" cy="13" r="4.6" fill="#ffffff"/></svg>`,
  });
}

// Icon outlines (24×24, stroke) — mostly from lucide; the temple is a simple shikhara.
const GLYPHS: Record<PlaceKind, string> = {
  TEMPLE: '<path d="M12 2.5l2.2 4H9.8z"/><path d="M8.5 7.5h7l1.5 4h-10z"/><path d="M6 12.5h12V21H6z"/><path d="M10 21v-4a2 2 0 0 1 4 0v4"/>',
  ACADEMIC: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  LIBRARY: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  HOSTEL: '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/>',
  CANTEEN: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  OFFICE: '<path d="M10 12h4"/><path d="M10 8h4"/><path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M2 21h20"/>',
  GATE: '<path d="M11 20H2"/><path d="M11 4.562v16.157a1 1 0 0 0 1.242.97L19 20V5.562a2 2 0 0 0-1.515-1.94l-4-1A2 2 0 0 0 11 4.561z"/><path d="M11 4H8a2 2 0 0 0-2 2v14"/><path d="M14 12h.01"/><path d="M22 20h-3"/>',
  GARDEN: '<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"/>',
  HEALTH: '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/><path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
  SPORTS: '<path d="M6 9H4.5a1 1 0 0 1 0-5H6"/><path d="M18 9h1.5a1 1 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978"/><path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978"/><path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"/>',
  OTHER: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
};

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Round icon badge with a text label beside it, like building and temple labels on Google Maps. */
export function placeIcon(kind: PlaceKind, label: string) {
  const color = PLACE_COLORS[kind] ?? PLACE_COLORS.OTHER;
  return L.divIcon({
    className: "",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
    html: `<div style="display:flex;align-items:center;gap:4px;width:max-content;pointer-events:auto">
      <span style="display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgb(0 0 0/.35)">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPHS[kind] ?? GLYPHS.OTHER}</svg>
      </span>
      <span style="font:600 12px/1.2 system-ui,sans-serif;color:${color};max-width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 0 2px #fff,0 0 2px #fff,0 0 3px #fff,0 0 3px #fff">${escapeHtml(label)}</span>
    </div>`,
  });
}
