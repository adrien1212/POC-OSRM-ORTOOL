import { Minus, Plus, Truck } from "lucide-react";

interface Props {
  title: string;
  quantity: number;
  onChange: (n: number) => void;
}

export function NumberConfig({ title, quantity, onChange }: Props) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Truck className="h-4 w-4 text-primary" />
        {title}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(quantity - 1)}
          disabled={quantity <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-accent disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-12 rounded-md border border-input bg-background py-1 text-center text-sm outline-none focus:border-ring"
        />
        <button
          type="button"
          onClick={() => onChange(quantity + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-accent"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
