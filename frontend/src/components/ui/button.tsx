import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/*
 * Canvas Workspace button — see components/buttons/Button.prompt.md in the
 * design-system skill.
 *
 * The pill (9999px) is the loudest brand signature: never square off the
 * corners. `ghost` is the one documented 8px exception. Yellow is brand
 * emphasis only and is NEVER a standard CTA. Press darkens rather than scales.
 * Disabled is a --hairline fill with --muted text. Focus is a 2px blue edge,
 * not a glow.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full",
    "text-sm font-medium cursor-pointer",
    "transition-colors duration-150 ease-brand",
    "outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-brand-blue",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-hairline disabled:text-muted-ink disabled:border-transparent",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-ink text-canvas hover:bg-charcoal active:bg-charcoal",
        primary: "bg-ink text-canvas hover:bg-charcoal active:bg-charcoal",
        secondary:
          "border border-hairline-strong bg-canvas text-ink hover:bg-hairline-soft active:bg-hairline",
        yellow:
          "bg-brand-yellow text-ink hover:bg-brand-yellow-deep active:bg-brand-yellow-deep",
        blue: "bg-brand-blue text-canvas hover:bg-blue-450 active:bg-blue-pressed",
        onDark:
          "bg-canvas text-ink hover:bg-hairline-soft active:bg-hairline-soft",
        destructive:
          "bg-coral-dark text-canvas hover:opacity-90 active:opacity-90",
        outline:
          "border border-hairline-strong bg-canvas text-ink hover:bg-hairline-soft active:bg-hairline",
        ghost:
          "rounded-md text-slate hover:bg-hairline-soft hover:text-ink active:bg-hairline",
        link: "text-brand-blue underline-offset-4 hover:underline hover:text-blue-450 active:text-blue-pressed",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-10 px-4 text-[13px]",
        xs: "h-8 px-3 text-[13px]",
        lg: "h-12 px-6",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
