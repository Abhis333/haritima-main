import Image from "next/image";
import { cn } from "@/lib/utils";

/** Uses the uploaded photo, or a quiet botanical placeholder until one is added. */
export function PlantImage({
  src,
  alt,
  name,
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority,
}: {
  src?: string | null;
  alt: string;
  name: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-parch", className)}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }
  return (
    <div className={cn("relative flex items-end overflow-hidden bg-[#dfe6cf]", className)} role="img" aria-label={`${alt} (photo not yet added)`}>
      <svg viewBox="0 0 200 140" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <g fill="none" stroke="#93a86e" strokeWidth="1.2" opacity="0.8">
          <path d="M-10 120 C 50 80, 90 90, 210 20" />
          <path d="M40 98 C 44 80, 60 72, 70 74 C 66 88, 54 96, 40 98Z" fill="#c9d6ae" />
          <path d="M92 84 C 98 62, 118 56, 128 58 C 122 76, 106 84, 92 84Z" fill="#b9ca98" />
          <path d="M140 58 C 150 40, 168 36, 178 38 C 170 54, 154 60, 140 58Z" fill="#c9d6ae" />
          <path d="M70 90 C 76 106, 92 112, 100 110 C 96 98, 84 90, 70 90Z" fill="#b9ca98" />
        </g>
      </svg>
      <span className="deva relative m-4 text-5xl text-forest/35" aria-hidden>
        {name.slice(0, 1)}
      </span>
    </div>
  );
}
