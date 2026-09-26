import { prisma } from "@/lib/prisma";
import { handle, requireAdmin } from "@/lib/guards";
import { plantQuerySchema, plantSchema } from "@/lib/validation";
import { findPlants } from "@/lib/search";
import { slugify } from "@/lib/utils";
import { audit } from "@/lib/audit";
import { indexPlant } from "@/lib/rag";

export const GET = handle(async (req: Request) => {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const result = await findPlants(plantQuerySchema.parse(params));
  return Response.json(result, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
});

export const POST = handle(async (req: Request) => {
  const admin = await requireAdmin();
  const { categoryIds, ...data } = plantSchema.parse(await req.json());
  let slug = slugify(data.commonName);
  if (await prisma.plant.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
  const plant = await prisma.plant.create({
    data: { ...data, slug, categories: { connect: categoryIds.map((id) => ({ id })) } },
  });
  await audit(admin.id, "CREATE", "Plant", plant.id, { commonName: plant.commonName });
  // Awaited so serverless platforms don't freeze the function mid-index.
  await indexPlant(plant.id).catch(console.error);
  return Response.json(plant, { status: 201 });
});
