"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "./ui/skeleton";

// Leaflet touches `window`, so it only renders in the browser.
export const PlantMapLoader = dynamic(() => import("./PlantMap"), {
  ssr: false,
  loading: () => <Skeleton className="h-[60vh] w-full rounded-xl" />,
});
