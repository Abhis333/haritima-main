import { LeafMark } from "@/components/Logo";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <LeafMark className="h-12 w-12 animate-pulse" />
      <span className="deva text-2xl text-forest">हरि<span className="font-sans font-light text-leaf">tima</span></span>
      <span className="sr-only">Loading</span>
    </div>
  );
}
