import { prisma } from "@/lib/prisma";
import { PlantForm } from "@/components/admin/PlantForm";

export default async function NewPlant() {
  const categories = await prisma.plantCategory.findMany({ select: { id: true, nameEn: true }, orderBy: { nameEn: "asc" } });
  return (
    <div className="max-w-5xl">
      <h1 className="mb-6 text-4xl">Add plant</h1>
      <PlantForm categories={categories} />
    </div>
  );
}
