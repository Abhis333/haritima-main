import { prisma } from "@/lib/prisma";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { LocateButton } from "@/components/admin/LocateButton";
import { MAX_LOCATION_PHOTOS } from "@/lib/validation";
import { PLACE_KINDS } from "@/lib/places";
import { dictionaries } from "@/lib/i18n/dictionaries";

export default async function AdminPlaces() {
  const rows = await prisma.campusPlace.findMany({ orderBy: [{ kind: "asc" }, { name: "asc" }] });
  const kinds = dictionaries.en.map.placeKinds;
  return (
    <>
      <ResourceManager
        title="Campus places"
        endpoint="/api/places"
        rows={rows}
        searchKeys={["name", "nameHi", "kind"]}
        defaults={{ isApproximate: true, kind: "OTHER" }}
        formExtras={<LocateButton />}
        columns={[
          { key: "name", label: "Name" },
          { key: "nameHi", label: "Hindi name" },
          { key: "kind", label: "Type", badge: true },
          { key: "latitude", label: "Lat" },
          { key: "longitude", label: "Lng" },
          { key: "isApproximate", label: "Approximate" },
          { key: "photos.length", label: "Photos" },
        ]}
        fields={[
          { name: "name", label: "Name", type: "text", required: true, help: "As people on campus call it, e.g. Pragyeshwar Mahadev Temple" },
          { name: "nameHi", label: "Name in Hindi", type: "text" },
          { name: "kind", label: "Type", type: "select", required: true, options: PLACE_KINDS.map((k) => ({ value: k, label: kinds[k] })) },
          { name: "latitude", label: "Latitude", type: "number", step: "any", required: true },
          { name: "longitude", label: "Longitude", type: "number", step: "any", required: true },
          { name: "description", label: "Short description", type: "textarea", full: true },
          { name: "descriptionHi", label: "Short description in Hindi", type: "textarea", full: true },
          { name: "isApproximate", label: "Coordinates are approximate (not GPS-surveyed)", type: "checkbox" },
          { name: "photos", label: "Photos of the place", type: "photos", max: MAX_LOCATION_PHOTOS, full: true, help: `Up to ${MAX_LOCATION_PHOTOS}; the first one is shown on the map.` },
        ]}
      />
      <div className="mt-4 max-w-2xl space-y-2 text-sm text-muted-foreground">
        <p className="font-medium text-forest">Adding a temple, building or gate</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Open this page on your phone (the deployed https site), stand at the entrance of the place and tap Add.</li>
          <li>Tap “Use my current location”. Readings within ±20 m untick “approximate” automatically.</li>
          <li>Enter the name in English and Hindi, choose the type, add a photo and Save. The place appears on the public map with a label and a “Guide me here” button.</li>
        </ol>
        <p>Places must lie inside the campus map area. Only add names you have checked on campus.</p>
      </div>
    </>
  );
}
