import { z } from "zod";

const text = (max: number) => z.string().trim().max(max);
const optText = (max: number) =>
  z.string().trim().max(max).optional().nullable().transform((v) => (v ? v : null));
const list = z
  .union([z.array(z.string()), z.string()])
  .optional()
  .transform((v) =>
    (Array.isArray(v) ? v : (v ?? "").split(/\n|;/)).map((s) => s.trim()).filter(Boolean).slice(0, 50),
  );
const httpsUrl = z
  .string()
  .trim()
  .url()
  .refine((u) => u.startsWith("https://"), "Must be an https URL")
  .optional()
  .nullable()
  .or(z.literal("").transform(() => null));

export const plantSchema = z.object({
  commonName: text(120).min(2),
  scientificName: text(160).min(3),
  hindiName: optText(120),
  sanskritName: optText(160),
  otherNames: list,
  family: optText(120),
  plantType: z.enum(["TREE", "SHRUB", "HERB", "CLIMBER", "GRASS", "SUCCULENT", "OTHER"]).default("OTHER"),
  availability: z.enum(["AVAILABLE", "SEASONAL", "LIMITED", "NOT_ON_CAMPUS"]).default("AVAILABLE"),
  description: text(5000).min(10),
  descriptionHi: optText(5000),
  ayurvedicProperties: optText(2000),
  traditionalUses: list,
  traditionalUsesHi: list,
  plantParts: list,
  preparation: optText(3000),
  cultivation: optText(3000),
  precautions: optText(3000),
  imageUrl: httpsUrl,
  imageAlt: optText(300),
  featured: z.boolean().optional().default(false),
  categoryIds: z.array(z.string().cuid()).max(10).optional().default([]),
});

export const locationSchema = z.object({
  plantId: z.string().cuid(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  isApproximate: z.boolean().default(true),
  campusArea: text(120).min(2),
  locationDescription: optText(500),
  landmark: optText(200),
});

export const referenceSchema = z.object({
  plantId: z.string().cuid(),
  textName: text(200).min(2),
  author: optText(200),
  chapter: optText(120),
  section: optText(120),
  verse: optText(120),
  citation: text(1000).min(2),
  referenceUrl: httpsUrl,
  sourceType: z.enum([
    "CLASSICAL_AYURVEDIC_TEXT",
    "GOVERNMENT_PUBLICATION",
    "UNIVERSITY_PUBLICATION",
    "BOTANICAL_REFERENCE",
    "RESEARCH_PUBLICATION",
  ]),
  verificationStatus: z.enum(["VERIFIED", "PENDING", "REJECTED"]).default("PENDING"),
  notes: optText(1000),
});

export const benefitSchema = z.object({
  plantId: z.string().cuid(),
  concern: text(60).min(2).transform((s) => s.toLowerCase()),
  concernHi: optText(60),
  description: text(1000).min(5),
  plantPart: optText(100),
  referenceId: z.preprocess((v) => (v === "" ? null : v), z.string().cuid().nullable().optional()),
});

export const mantraSchema = z.object({
  title: text(160).min(2),
  sanskritText: text(3000).min(2),
  transliteration: optText(3000),
  hindiTranslation: text(3000).min(2),
  englishTranslation: text(3000).min(2),
  meaning: optText(3000),
  source: text(300).min(2),
  verificationStatus: z.enum(["VERIFIED", "PENDING", "REJECTED"]).default("PENDING"),
  category: z.enum(["Nature", "Peace", "Health", "Environment", "Knowledge", "Well-being"]),
  audioUrl: httpsUrl,
  featured: z.boolean().optional().default(false),
});

export const categorySchema = z.object({
  slug: text(60).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes"),
  nameEn: text(60).min(2),
  nameHi: text(60).min(1),
  icon: optText(40),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
});

export const chatSchema = z.object({
  message: text(800).min(2),
  conversationId: z.string().cuid().optional(),
  lang: z.enum(["en", "hi"]).default("en"),
});

export const feedbackSchema = z.object({
  name: text(100).min(2),
  email: z.string().trim().email().max(200),
  subject: text(150).min(2),
  message: text(3000).min(10),
  // Honeypot: any value is accepted here so bots get no 422 hint; the route silently drops filled submissions.
  website: z.string().max(200).optional(),
});

export const registerSchema = z.object({
  name: text(100).min(2),
  email: z.string().trim().email().max(200).transform((e) => e.toLowerCase()),
  password: z.string().min(8, "Use at least 8 characters").max(200),
});

export const plantQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().max(60).optional(),
  type: z.string().max(20).optional(),
  area: z.string().max(120).optional(),
  availability: z.string().max(20).optional(),
  use: z.string().max(60).optional(),
  page: z.coerce.number().int().min(1).max(500).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(12),
});
