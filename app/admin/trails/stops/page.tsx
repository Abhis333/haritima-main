import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ResourceManager } from "@/components/admin/ResourceManager";

export default async function AdminTrailStops() {
  const [rows, trails, locations] = await Promise.all([
    prisma.trailStop.findMany({
      include: { trail: { select: { title: true } }, location: { include: { plant: { select: { commonName: true } } } } },
      orderBy: [{ trail: { title: "asc" } }, { position: "asc" }],
    }),
    prisma.trail.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    prisma.plantLocation.findMany({ include: { plant: { select: { commonName: true } } }, orderBy: [{ plant: { commonName: "asc" } }] }),
  ]);
  return (
    <>
      <ResourceManager
        title="Trail stops"
        endpoint="/api/trail-stops"
        rows={rows}
        searchKeys={["trail.title", "location.plant.commonName", "location.campusArea"]}
        columns={[
          { key: "trail.title", label: "Trail" },
          { key: "position", label: "#" },
          { key: "location.plant.commonName", label: "Plant" },
          { key: "location.campusArea", label: "Campus area" },
          { key: "note", label: "Note" },
        ]}
        fields={[
          { name: "trailId", label: "Trail", type: "select", required: true, options: trails.map((t) => ({ value: t.id, label: t.title })) },
          {
            name: "locationId",
            label: "Plant location",
            type: "select",
            required: true,
            options: locations.map((l) => ({ value: l.id, label: `${l.plant.commonName} — ${l.campusArea}` })),
          },
          { name: "position", label: "Stop number", type: "number", step: "1", required: true, help: "Walking order: 1 is the first stop." },
          { name: "note", label: "Note shown at this stop", type: "textarea", full: true },
          { name: "noteHi", label: "Note (Hindi)", type: "textarea", full: true },
        ]}
      />
      <p className="mt-4 text-sm text-muted-foreground">
        <Link href="/admin/trails" className="text-leaf underline">← Back to trails</Link>
      </p>
    </>
  );
}
