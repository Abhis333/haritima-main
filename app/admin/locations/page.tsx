import { prisma } from "@/lib/prisma";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { LocateButton } from "@/components/admin/LocateButton";

export default async function AdminLocations() {
  const [rows, plants] = await Promise.all([
    prisma.plantLocation.findMany({ include: { plant: { select: { commonName: true } } }, orderBy: [{ campusArea: "asc" }] }),
    prisma.plant.findMany({ select: { id: true, commonName: true }, orderBy: { commonName: "asc" } }),
  ]);
  return (
    <>
      <ResourceManager
        title="Plant locations"
        endpoint="/api/locations"
        rows={rows}
        searchKeys={["plant.commonName", "campusArea", "landmark"]}
        defaults={{ isApproximate: true }}
        formExtras={<LocateButton />}
        columns={[
          { key: "plant.commonName", label: "Plant" },
          { key: "campusArea", label: "Campus area" },
          { key: "locationDescription", label: "Description" },
          { key: "latitude", label: "Lat" },
          { key: "longitude", label: "Lng" },
          { key: "isApproximate", label: "Approximate" },
        ]}
        fields={[
          { name: "plantId", label: "Plant", type: "select", required: true, options: plants.map((p) => ({ value: p.id, label: p.commonName })) },
          { name: "campusArea", label: "Campus area", type: "text", required: true, help: "e.g. Medicinal Plant Garden" },
          { name: "latitude", label: "Latitude", type: "number", step: "0.000001", required: true },
          { name: "longitude", label: "Longitude", type: "number", step: "0.000001", required: true },
          { name: "locationDescription", label: "Location description", type: "text", full: true },
          { name: "landmark", label: "Landmark", type: "text" },
          { name: "isApproximate", label: "Coordinates are approximate (not GPS-surveyed)", type: "checkbox" },
        ]}
      />
      <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
        Surveying on campus: open this page on your phone (the deployed https site), stand next to the plant, then Add or Edit and tap
        “Use my current location”. Readings within ±20 m untick “approximate” automatically. Without a phone, long-press your blue dot in
        Google Maps and copy the coordinates; untick “approximate” only for surveyed points.
      </p>
    </>
  );
}
