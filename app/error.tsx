"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-h flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-3xl">This page didn’t load</h1>
      <p className="mt-3 max-w-md text-muted-foreground">The server couldn’t fetch the data. Check your connection and try again.</p>
      <Button className="mt-6" onClick={reset}>Try again</Button>
    </div>
  );
}
