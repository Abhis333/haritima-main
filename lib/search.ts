import { Prisma, type Availability, type PlantType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const STOPWORDS = new Set(
  [
    "a an the i me my is am are was be have has had do does which what who where when how for of to in on at and or with from about can could should tell show plants plant campus near any some traditionally used use this that it its please",
    // Hindi function words. Without these, particles like के/से/में become prefix terms that match almost every Hindi line.
    "के का की को से में पर और या है हैं था थे थी लिए लिये कौन कौनसे क्या कैसे कहाँ कहां कोई कुछ वाले वाली वाला पौधे पौधा पौधों बताइए बताएं बताओ बताइये मुझे मेरे मेरी हम यह ये वह वो एक भी तो ही किस किन जो इस उस इसके उसके कर करने करें करता होता होते होती सकते सकता सकती परिसर उपयोग",
    // Common romanised Hindi function words ("neend ke liye paudhe").
    "ke ka ki ko se mein hai hain liye kaun konse kaunse kya kaise koi kuch wale wali paudhe paudha podhe batao bataiye",
  ]
    .join(" ")
    .split(" "),
);

/** Very light English stemming so "sleeping" also matches "sleep". Devanagari tokens pass through. */
function stem(w: string) {
  if (!/^[a-z]+$/.test(w) || w.length < 5) return w;
  return w.replace(/(ingly|ing|edly|ed|ies|es|s)$/, "") || w;
}

// Everyday words → terms that appear in Ayurvedic records.
const SYNONYMS: Record<string, string[]> = {
  sleep: ["nidra", "insomnia", "anidra", "नींद", "निद्रा"],
  insomnia: ["sleep", "nidra"],
  digest: ["agni", "appetite", "digestion", "पाचन"],
  stress: ["anxiety", "calm", "rasayana", "तनाव"],
  memory: ["medhya", "cognition", "स्मृति"],
  immunity: ["rasayana", "vyadhikshamatva", "रोग"],
  cough: ["kasa", "respiratory", "खांसी"],
  cold: ["pratishyaya", "respiratory", "सर्दी"],
  skin: ["twak", "kushtha", "त्वचा"],
  fever: ["jwara", "ज्वर", "बुखार"],
  heart: ["hridya", "cardiac", "हृदय"],
  hair: ["kesha", "बाल"],
  नींद: ["sleep", "nidra"],
  पाचन: ["digest", "agni"],
};

export function tokenize(q: string) {
  const words = q
    .toLowerCase()
    .normalize("NFC")
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    // Tokens must contain a letter or digit; mark-only tokens could produce an invalid tsquery.
    .filter((w) => w.length > 1 && !STOPWORDS.has(w) && /[\p{L}\p{N}]/u.test(w))
    .slice(0, 12);
  const expanded = new Set<string>();
  for (const w of words) {
    const s = stem(w);
    expanded.add(s);
    for (const syn of SYNONYMS[s] ?? SYNONYMS[w] ?? []) expanded.add(stem(syn));
  }
  return [...expanded].slice(0, 24);
}

/** Builds an OR prefix tsquery string: "sleep:* | nidra:*". Tokens are already sanitised by tokenize(). */
export function toTsQuery(q: string) {
  const tokens = tokenize(q);
  return tokens.length ? tokens.map((t) => `${t}:*`).join(" | ") : null;
}

export async function searchPlantIds(q: string): Promise<string[]> {
  const tsq = toTsQuery(q);
  const like = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
  const rows = await prisma.$queryRaw<{ id: string; rank: number }[]>(Prisma.sql`
    SELECT p.id,
      ${tsq ? Prisma.sql`ts_rank(d.doc, to_tsquery('simple', ${tsq}))` : Prisma.sql`0`}::float AS rank
    FROM "Plant" p
    CROSS JOIN LATERAL (
      SELECT to_tsvector('simple', concat_ws(' ',
        p."commonName", p."scientificName", p."hindiName", p."sanskritName",
        array_to_string(p."otherNames", ' '), p.description, p."descriptionHi",
        p."ayurvedicProperties", array_to_string(p."traditionalUses", ' '),
        array_to_string(p."traditionalUsesHi", ' '), array_to_string(p."plantParts", ' '), p.family
      )) AS doc
    ) d
    WHERE ${tsq ? Prisma.sql`d.doc @@ to_tsquery('simple', ${tsq}) OR` : Prisma.empty}
      p."commonName" ILIKE ${like} OR p."scientificName" ILIKE ${like}
      OR p."hindiName" ILIKE ${like} OR p."sanskritName" ILIKE ${like}
    ORDER BY rank DESC
    LIMIT 200
  `);
  return rows.map((r) => r.id);
}

export type PlantQuery = {
  q?: string;
  category?: string;
  type?: string;
  area?: string;
  availability?: string;
  use?: string;
  page: number;
  pageSize: number;
};

const PLANT_TYPES = ["TREE", "SHRUB", "HERB", "CLIMBER", "GRASS", "SUCCULENT", "OTHER"];
const AVAILABILITY = ["AVAILABLE", "SEASONAL", "LIMITED", "NOT_ON_CAMPUS"];

export async function findPlants(query: PlantQuery) {
  const where: Prisma.PlantWhereInput = {};
  let rankedIds: string[] | null = null;

  if (query.q) {
    // A search-query failure shows "no results" rather than a 500.
    rankedIds = await searchPlantIds(query.q).catch((e: unknown): string[] => {
      console.error("Plant search failed", e);
      return [];
    });
    where.id = { in: rankedIds };
  }
  if (query.category) where.categories = { some: { slug: query.category } };
  if (query.type && PLANT_TYPES.includes(query.type)) where.plantType = query.type as PlantType;
  if (query.availability && AVAILABILITY.includes(query.availability))
    where.availability = query.availability as Availability;
  if (query.area) where.locations = { some: { campusArea: query.area } };
  if (query.use) where.benefits = { some: { concern: query.use.toLowerCase() } };

  const [total, plants] = await Promise.all([
    prisma.plant.count({ where }),
    prisma.plant.findMany({
      where,
      include: { categories: true, locations: { take: 1 } },
      orderBy: [{ featured: "desc" }, { commonName: "asc" }],
      // When searching we sort by rank in memory, so fetch the whole (bounded) match set.
      ...(rankedIds ? {} : { skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
    }),
  ]);

  let items = plants;
  if (rankedIds) {
    const order = new Map(rankedIds.map((id, i) => [id, i]));
    items = plants
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      .slice((query.page - 1) * query.pageSize, query.page * query.pageSize);
  }
  return { total, page: query.page, pageSize: query.pageSize, items };
}
