import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.8rem] font-medium", {
  variants: {
    variant: {
      default: "bg-forest/8 text-forest border border-forest/15",
      leaf: "bg-[#dfe6cf] text-forest",
      verified: "bg-[#dbe8cc] text-[#2e5a1f] border border-[#a9c48c]",
      pending: "bg-[#f3e2bd] text-[#7a5a14] border border-[#e0c483]",
      rejected: "bg-[#f1d3cc] text-[#8a2e22]",
      outline: "border border-border text-muted-foreground",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
