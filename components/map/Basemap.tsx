"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import { useEffect, useState } from "react";
import { TileLayer, useMap } from "react-leaflet";
import { CAMPUS_BOUNDS } from "@/lib/campus";

// Google-like vector basemap: OpenFreeMap "Liberty" (OpenStreetMap data, free, no key, attribution required).
const STYLE_URL = process.env.NEXT_PUBLIC_MAP_STYLE || "https://tiles.openfreemap.org/styles/liberty";
// Optional raster tile template (e.g. a commercial provider). When set, it replaces the vector style.
const RASTER_URL = process.env.NEXT_PUBLIC_MAP_URL;
// Used when the device has no WebGL or the vector style cannot load.
const FALLBACK_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const VECTOR_ATTRIBUTION = `<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> ${OSM}`;

function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Renders the MapLibre vector style underneath Leaflet's markers; Leaflet keeps handling pan, zoom and bounds. */
function VectorLayer({ onFail }: { onFail: () => void }) {
  const map = useMap();
  useEffect(() => {
    let loaded = false;
    const layer = maplibreGL({ style: STYLE_URL, attributionControl: false });
    layer.addTo(map);
    map.attributionControl?.addAttribution(VECTOR_ATTRIBUTION);
    const gl = layer.getMaplibreMap();
    gl.once("load", () => { loaded = true; });
    // An error before the style has loaded (service down, blocked) falls back to raster tiles.
    gl.on("error", () => { if (!loaded) onFail(); });
    return () => {
      map.attributionControl?.removeAttribution(VECTOR_ATTRIBUTION);
      layer.remove();
    };
  }, [map, onFail]);
  return null;
}

export function Basemap() {
  const [vector, setVector] = useState(() => !RASTER_URL && webglAvailable());
  const [fail] = useState(() => () => setVector(false));
  if (vector) return <VectorLayer onFail={fail} />;
  return <TileLayer url={RASTER_URL || FALLBACK_TILES} attribution={OSM} maxZoom={19} bounds={CAMPUS_BOUNDS} />;
}
