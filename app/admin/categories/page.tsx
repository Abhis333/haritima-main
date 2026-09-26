import { prisma } from "@/lib/prisma";
import { ResourceManager } from "@/components/admin/ResourceManager";

export default async function AdminCategories() {
  const rows = await prisma.plantCategory.findMany({ include: { _count: { select: { plants: true } } }, orderBy: { nameEn: "asc" } });
  return (
    <ResourceManager
      title="Categories"
      endpoint="/api/categories"
      rows={rows}
      columns={[
        { key: "nameEn", label: "English" },
        { key: "nameHi", label: "Hindi" },
        { key: "slug", label: "Slug" },
        { key: "color", label: "Map colour" },
        { key: "_count.plants", label: "Plants" },
      ]}
      fields={[
        { name: "nameEn", label: "Name (English)", type: "text", required: true },
        { name: "nameHi", label: "Name (Hindi)", type: "text", required: true },
        { name: "slug", label: "Slug", type: "text", required: true, help: "lowercase-with-dashes" },
        { name: "color", label: "Map marker colour (hex)", type: "color", help: "e.g. #4e7a3a" },
        { name: "icon", label: "Lucide icon name", type: "text" },
      ]}
    />
  );
}
