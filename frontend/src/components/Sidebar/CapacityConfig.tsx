import { Package } from "lucide-react";

interface Props {
  vehicleCapacity: number;
  vehicles: number;
  vehicleCapacities: number[];
  onDefaultChange: (n: number) => void;
  onVehicleCapacityChange: (index: number, n: number) => void;
}

export function CapacityConfig({
  vehicleCapacity,
  vehicles,
  vehicleCapacities,
  onDefaultChange,
  onVehicleCapacityChange,
}: Props) {
  const totalCapacity = vehicleCapacities.reduce((sum, value) => sum + value, 0);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Package className="h-4 w-4 text-primary" />
          Vehicle capacity
        </span>
        <span className="rounded-full bg-secondary px-2 py-1 text-[11px] font-medium text-secondary-foreground">
          {totalCapacity} total
        </span>
      </div>

      <div className="space-y-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            Default capacity
          </span>
          <input
            type="number"
            min={1}
            value={vehicleCapacity}
            onChange={(e) => onDefaultChange(Number(e.target.value))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </label>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Per-vehicle overrides
        </p>
        <div className="grid gap-2">
          {Array.from({ length: vehicles }, (_, index) => {
            const value = vehicleCapacities[index] ?? vehicleCapacity;
            return (
              <label
                key={index}
                className="flex items-center gap-3 rounded-md border border-border px-3 py-2"
              >
                <span className="w-20 shrink-0 text-xs font-medium text-foreground">
                  Vehicle {index + 1}
                </span>
                <input
                  type="number"
                  min={1}
                  value={value}
                  onChange={(e) =>
                    onVehicleCapacityChange(index, Number(e.target.value))
                  }
                  className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>
          Default is applied to new vehicles.
        </span>
        <span className="hidden sm:inline">•</span>
        <span>Overrides are sent to the backend per vehicle.</span>
      </div>
    </div>
  );
}
