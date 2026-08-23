import { Minus, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Truck } from "lucide-react";
import { cardBase, focusEdge } from "@/lib/brand";

interface Props {
  title: string;
  quantity: number;
  onChange: (n: number) => void;
  icon?: LucideIcon;
  min?: number;
}

/*
 * Stepper row. Card is flat with a hairline edge; the two steppers are pills
 * (utility IconButton shape), the numeric field keeps the 8px input corner.
 */
export function NumberConfig({
  title,
  quantity,
  onChange,
  icon: Icon = Truck,
  min = 1,
}: Props) {
  const stepper = [
    "flex h-8 w-8 items-center justify-center rounded-full border border-hairline-strong text-ink",
    "transition-colors duration-150 ease-brand",
    "hover:bg-hairline-soft active:bg-hairline",
    "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
    "disabled:border-transparent disabled:bg-hairline disabled:text-muted-ink",
  ].join(" ");

  return (
    <div
      className={`${cardBase} flex items-center justify-between gap-3 px-3 py-2.5`}
    >
      <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink">
        <Icon className="h-4 w-4 shrink-0 text-steel" />
        <span className="truncate">{title}</span>
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(quantity - 1)}
          disabled={quantity <= min}
          aria-label={`Decrease ${title}`}
          className={stepper}
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          min={min}
          value={quantity}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={title}
          className={[
            "w-14 rounded-md border border-hairline-strong bg-canvas py-1 text-center text-sm text-ink",
            "transition-colors duration-150 ease-brand",
            focusEdge,
          ].join(" ")}
        />
        <button
          type="button"
          onClick={() => onChange(quantity + 1)}
          aria-label={`Increase ${title}`}
          className={stepper}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
