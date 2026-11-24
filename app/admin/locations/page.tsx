import { prisma } from "@/lib/prisma";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { LocateButton } from "@/components/admin/LocateButton";
import { MAX_LOCATION_PHOTOS } from "@/lib/validation";

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
          { key: "photos.length", label: "Photos" },
        ]}
        fields={[
          { name: "plantId", label: "Plant", type: "select", required: true, options: plants.map((p) => ({ value: p.id, label: p.commonName })) },
          { name: "campusArea", label: "Campus area", type: "text", required: true, help: "e.g. Medicinal Plant Garden" },
          { name: "latitude", label: "Latitude", type: "number", step: "any", required: true },
          { name: "longitude", label: "Longitude", type: "number", step: "any", required: true },
          { name: "locationDescription", label: "Location description", type: "text", full: true },
          { name: "landmark", label: "Landmark", type: "text" },
          { name: "isApproximate", label: "Coordinates are approximate (not GPS-surveyed)", type: "checkbox" },
          { name: "photos", label: "Photos of the plant at this spot", type: "photos", max: MAX_LOCATION_PHOTOS, full: true, help: `Up to ${MAX_LOCATION_PHOTOS}. On a phone you can take them with the camera; large photos are shrunk before upload.` },
        ]}
      />
      <div className="mt-4 max-w-2xl space-y-2 text-sm text-muted-foreground">
        <p className="font-medium text-forest">Surveying a plant on campus</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Open this page on your phone (the deployed https site) and sign in.</li>
          <li>Stand next to the plant, then Add (new spot) or Edit (existing spot).</li>
          <li>Tap “Use my current location”. Readings within ±20 m untick “approximate” and clear the placeholder note automatically.</li>
          <li>Type the real campus area and a short description, add photos, and Save.</li>
        </ol>
        <p>Without a phone, long-press your blue dot in Google Maps and copy the coordinates; untick “approximate” only for surveyed points.</p>
      </div>
    </>
  );
}
