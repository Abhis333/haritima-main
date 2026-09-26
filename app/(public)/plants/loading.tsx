import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-h py-12" role="status" aria-label="Loading plants">
      <Skeleton className="h-12 w-72" />
      <Skeleton className="mt-8 h-14 w-full rounded-full" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-lg" />)}
      </div>
    </div>
  );
}
