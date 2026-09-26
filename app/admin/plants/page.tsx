import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/admin/SmallActions";

export default async function AdminPlants() {
  const plants = await prisma.plant.findMany({
    include: { categories: true, _count: { select: { locations: true, references: true } } },
    orderBy: { commonName: "asc" },
  });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Plants</h1>
        <Button asChild><Link href="/admin/plants/new"><Plus /> Add plant</Link></Button>
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border border-parch bg-card">
        <table className="w-full text-left text-[0.95rem]">
          <thead className="border-b border-parch bg-parch/40 text-sm text-forest">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Plant</th>
              <th scope="col" className="px-4 py-3 font-medium">Categories</th>
              <th scope="col" className="px-4 py-3 font-medium">Locations</th>
              <th scope="col" className="px-4 py-3 font-medium">References</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {plants.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No plants yet. Add the first one.</td></tr>}
            {plants.map((p) => (
              <tr key={p.id} className="border-b border-parch/70 last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/plants/${p.id}`} className="font-medium text-forest hover:underline">{p.commonName}</Link>
                  {p.hindiName && <span className="deva ml-2 text-forest/70">{p.hindiName}</span>}
                  <div className="sci text-sm text-muted-foreground">{p.scientificName}</div>
                  {p.featured && <Badge variant="leaf" className="mt-1">Featured</Badge>}
                </td>
                <td className="px-4 py-3 text-sm">{p.categories.map((c) => c.nameEn).join(", ") || "—"}</td>
                <td className="px-4 py-3">{p._count.locations}</td>
                <td className="px-4 py-3">{p._count.references}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Button asChild variant="outline" size="sm"><Link href={`/admin/plants/${p.id}`}>Edit</Link></Button>{" "}
                  <DeleteButton endpoint={`/api/plants/${p.id}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
