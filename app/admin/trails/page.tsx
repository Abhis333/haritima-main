import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ResourceManager } from "@/components/admin/ResourceManager";

export default async function AdminTrails() {
  const rows = await prisma.trail.findMany({ include: { _count: { select: { stops: true } } }, orderBy: { title: "asc" } });
  return (
    <>
      <ResourceManager
        title="Walking trails"
        endpoint="/api/trails"
        rows={rows}
        searchKeys={["title", "slug"]}
        defaults={{ published: true }}
        columns={[
          { key: "title", label: "Title" },
          { key: "slug", label: "Slug" },
          { key: "_count.stops", label: "Stops" },
          { key: "published", label: "Published" },
        ]}
        fields={[
          { name: "title", label: "Title", type: "text", required: true },
          { name: "titleHi", label: "Title (Hindi)", type: "text" },
          { name: "slug", label: "Slug", type: "text", required: true, help: "Used in the URL, e.g. medicinal-garden-walk" },
          { name: "color", label: "Route colour", type: "color", help: "Dark enough for white stop numbers. Blank uses the theme green." },
          { name: "description", label: "Description", type: "textarea", required: true, full: true },
          { name: "descriptionHi", label: "Description (Hindi)", type: "textarea", full: true },
          { name: "published", label: "Published (visible on /trails)", type: "checkbox" },
        ]}
      />
      <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
        Add the stops of each trail on the <Link href="/admin/trails/stops" className="text-leaf underline">Trail stops</Link> page. Stops point at plant
        locations, so a trail follows any location you correct with GPS.
      </p>
    </>
  );
}
