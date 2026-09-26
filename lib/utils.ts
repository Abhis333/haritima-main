import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export const SOURCE_TYPE_LABEL: Record<string, string> = {
  CLASSICAL_AYURVEDIC_TEXT: "Classical Ayurvedic text",
  GOVERNMENT_PUBLICATION: "Government publication",
  UNIVERSITY_PUBLICATION: "University publication",
  BOTANICAL_REFERENCE: "Botanical reference",
  RESEARCH_PUBLICATION: "Research publication",
};

export const PLANT_TYPE_LABEL: Record<string, { en: string; hi: string }> = {
  TREE: { en: "Tree", hi: "वृक्ष" },
  SHRUB: { en: "Shrub", hi: "झाड़ी" },
  HERB: { en: "Herb", hi: "शाक/जड़ी" },
  CLIMBER: { en: "Climber", hi: "लता" },
  GRASS: { en: "Grass", hi: "घास" },
  SUCCULENT: { en: "Succulent", hi: "रसीला पौधा" },
  OTHER: { en: "Other", hi: "अन्य" },
};

export const AVAILABILITY_LABEL: Record<string, { en: string; hi: string }> = {
  AVAILABLE: { en: "On campus", hi: "परिसर में उपलब्ध" },
  SEASONAL: { en: "Seasonal", hi: "मौसमी" },
  LIMITED: { en: "Few specimens", hi: "सीमित" },
  NOT_ON_CAMPUS: { en: "Not on campus", hi: "परिसर में नहीं" },
};

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return Response.json({ error: message, ...extra }, { status });
}
