import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

/*
 * Flat by default: no shadow on the track or thumb. Checked is brand black,
 * unchecked is the strong hairline. Focus is a 2px blue edge, not a ring.
 */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
      "transition-colors duration-150 ease-brand",
      "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-ink data-[state=unchecked]:bg-hairline-strong",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-canvas ring-0",
        "transition-transform duration-150 ease-brand",
        "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
