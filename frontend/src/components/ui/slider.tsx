import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

/*
 * Flat: hairline track, brand-black range, hairline-strong thumb edge.
 * No shadow anywhere — depth in this system is spent only on the map surface.
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-hairline">
      <SliderPrimitive.Range className="absolute h-full bg-ink" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        "block h-4 w-4 rounded-full border border-hairline-strong bg-canvas",
        "transition-colors duration-150 ease-brand",
        "outline-none focus-visible:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
        "disabled:pointer-events-none disabled:opacity-50",
      )}
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
