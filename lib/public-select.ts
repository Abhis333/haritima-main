import type { Prisma } from "@prisma/client";

/**
 * Fields of an AyurvedicReference that are safe to return from public APIs.
 * `verifiedBy` (admin email), `notes` (reviewer notes) and timestamps stay admin-only.
 */
export const PUBLIC_REFERENCE_SELECT = {
  id: true,
  plantId: true,
  textName: true,
  author: true,
  chapter: true,
  section: true,
  verse: true,
  citation: true,
  referenceUrl: true,
  sourceType: true,
  verificationStatus: true,
} satisfies Prisma.AyurvedicReferenceSelect;

/** Mantras shown on any public page or API. REJECTED sources are never shown publicly. */
export const PUBLIC_MANTRA_WHERE = { verificationStatus: { not: "REJECTED" } } satisfies Prisma.MantraWhereInput;
