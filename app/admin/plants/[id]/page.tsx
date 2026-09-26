import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PlantForm } from "@/components/admin/PlantForm";

export default async function EditPlant({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [plant, categories] = await Promise.all([
    prisma.plant.findUnique({ where: { id }, include: { categories: { select: { id: true } } } }),
    prisma.plantCategory.findMany({ select: { id: true, nameEn: true }, orderBy: { nameEn: "asc" } }),
  ]);
  if (!plant) notFound();
  const { categories: cats, createdAt: _c, updatedAt: _u, slug: _s, ...rest } = plant;
  return (
    <div className="max-w-5xl">
      <h1 className="mb-6 text-4xl">Edit {plant.commonName}</h1>
      <PlantForm categories={categories} initial={{ ...rest, categoryIds: cats.map((c) => c.id) }} />
    </div>
  );
}
