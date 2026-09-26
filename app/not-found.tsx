import Link from "next/link";
import { LeafMark } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-h flex min-h-[70vh] flex-col items-center justify-center text-center">
      <LeafMark className="h-14 w-14" />
      <h1 className="mt-6 text-4xl">This path isn’t on the map</h1>
      <p className="mt-3 max-w-md text-muted-foreground">The page may have moved, or the plant record was removed. Start again from the plant list.</p>
      <div className="mt-6 flex gap-3">
        <Button asChild><Link href="/plants">Browse plants</Link></Button>
        <Button asChild variant="outline"><Link href="/">Home</Link></Button>
      </div>
    </div>
  );
}
