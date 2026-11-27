// Campus places (temples, buildings, gates …) shown on the map. Shared by server and client; no Leaflet here.

export const PLACE_KINDS = ["TEMPLE", "ACADEMIC", "LIBRARY", "HOSTEL", "CANTEEN", "OFFICE", "GATE", "GARDEN", "HEALTH", "SPORTS", "OTHER"] as const;
export type PlaceKind = (typeof PLACE_KINDS)[number];

export const PLACE_COLORS: Record<PlaceKind, string> = {
  TEMPLE: "#C2410C", ACADEMIC: "#1D4ED8", LIBRARY: "#6D28D9", HOSTEL: "#0F766E", CANTEEN: "#B45309", OFFICE: "#475569",
  GATE: "#334155", GARDEN: "#15803D", HEALTH: "#DC2626", SPORTS: "#0369A1", OTHER: "#57534E",
};

/** A campus place as the public map needs it (text already in the visitor's language). */
export type PlacePoint = {
  id: string;
  name: string;
  /** Second-language name shown after the main one, if any. */
  altName: string | null;
  kind: PlaceKind;
  description: string | null;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
  isApproximate: boolean;
};
