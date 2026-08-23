import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/*
 * Canvas Workspace badge — see components/badges/Badge.prompt.md.
 *
 * Pill radius, 13px semibold. Pastel tones label features; `promo` is the
 * saturated yellow reserved for the black promo strip; `success` is the only
 * green in the system.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[13px] font-semibold leading-5 transition-colors duration-150 ease-brand",
  {
    variants: {
      variant: {
        default: "bg-ink text-canvas",
        neutral: "bg-surface text-slate",
        outline: "border border-hairline text-slate",
        yellow: "bg-yellow-light text-yellow-dark",
        teal: "bg-teal-light text-moss-dark",
        coral: "bg-coral-light text-coral-dark",
        rose: "bg-rose-light text-ink",
        orange: "bg-orange-light text-ink",
        blue: "bg-brand-blue text-canvas",
        promo: "bg-brand-yellow text-ink",
        success: "bg-success text-canvas",
        destructive: "bg-brand-red text-coral-dark",
      },
      size: {
        default: "text-[13px]",
        sm: "px-2 py-0.5 text-[11px] leading-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
