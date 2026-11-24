"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  // A stale or missing JS chunk (common after a redeploy or dev recompile) is fixed by a full reload, not a reset.
  const staleChunk = error.name === "ChunkLoadError" || /Loading (CSS )?chunk|dynamically imported module/i.test(error.message);
  return (
    <div className="container-h flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-3xl">This page didn’t load</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        {staleChunk ? "The site was updated while this tab was open. Reload to get the latest version." : "Something went wrong while showing this page. Try again."}
      </p>
      {process.env.NODE_ENV === "development" && <pre className="mt-4 max-w-xl whitespace-pre-wrap text-left text-xs text-destructive">{error.name}: {error.message}</pre>}
      <Button className="mt-6" onClick={() => (staleChunk ? window.location.reload() : reset())}>
        {staleChunk ? "Reload" : "Try again"}
      </Button>
    </div>
  );
}
