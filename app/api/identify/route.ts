import { prisma } from "@/lib/prisma";
import { handle, HttpError } from "@/lib/guards";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { MAX_IMAGE_BYTES, sniffImage } from "@/lib/cloudinary";
import { binomial, identifyWithPlantNet } from "@/lib/plantnet";
import { readFormData } from "@/lib/body";

export const maxDuration = 40;
const LOW_CONFIDENCE = 0.35;
const ORGANS = ["leaf", "flower", "fruit", "bark", "auto"];

export const POST = handle(async (req: Request) => {
  const limit = rateLimit(`identify:${clientKey(req)}`, 8, 60_000);
  if (!limit.ok) throw new HttpError(429, "Too many identifications. Try again in a minute.");

  const form = await readFormData(req, MAX_IMAGE_BYTES, "The photo is larger than 5 MB.");
  const image = form.get("image");
  const organ = String(form.get("organ") ?? "auto");
  if (!(image instanceof File)) throw new HttpError(400, "Attach a photo.");
  if (!ORGANS.includes(organ)) throw new HttpError(400, "Unknown plant part.");
  if (image.size > MAX_IMAGE_BYTES) throw new HttpError(413, "The photo is larger than 5 MB.");
  const head = new Uint8Array(await image.slice(0, 16).arrayBuffer());
  if (!sniffImage(head)) throw new HttpError(415, "Use a JPG, PNG or WebP photo.");
  if (!process.env.PLANTNET_API_KEY) throw new HttpError(503, "Photo identification is not configured yet (PLANTNET_API_KEY).");

  const candidates = await identifyWithPlantNet(image, organ);

  // Match against Haritima records by genus + species (scientific name or listed synonyms).
  const plants = await prisma.plant.findMany({
    select: {
      slug: true, commonName: true, hindiName: true, scientificName: true, otherNames: true, traditionalUses: true,
      references: { where: { verificationStatus: "VERIFIED" }, select: { textName: true, citation: true } },
      locations: { take: 1, select: { campusArea: true, isApproximate: true } },
    },
  });
  const index = new Map<string, (typeof plants)[number]>();
  for (const p of plants) for (const n of [p.scientificName, ...p.otherNames]) index.set(binomial(n), p);

  const matches = candidates.slice(0, 5).map((c) => {
    const p = index.get(binomial(c.scientificName));
    return {
      scientificName: c.scientificName,
      commonNames: c.commonNames,
      family: c.family,
      confidence: c.score,
      plant: p
        ? {
            slug: p.slug,
            commonName: p.commonName,
            hindiName: p.hindiName,
            traditionalUses: p.traditionalUses,
            verifiedReferences: p.references,
            location: p.locations[0] ?? null,
          }
        : null,
    };
  });

  return Response.json({ lowConfidence: !matches.length || matches[0].confidence < LOW_CONFIDENCE, matches });
});
