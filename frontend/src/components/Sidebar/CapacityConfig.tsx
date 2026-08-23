import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cardBase, focusEdge } from "@/lib/brand";

interface Props {
  vehicles: number;
  vehicleCapacities: number[];
  onVehicleCapacityChange: (index: number, n: number) => void;
}

export function CapacityConfig({
  vehicles,
  vehicleCapacities,
  onVehicleCapacityChange,
}: Props) {
  const totalCapacity = vehicleCapacities.reduce(
    (sum, value) => sum + value,
    0,
  );

  return (
    <div className={`${cardBase} space-y-3 p-3`}>
      <div className="flex items-start justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium text-ink">
          <Package className="h-4 w-4 text-steel" />
          Vehicle capacity
        </span>
        <Badge variant="neutral" size="sm">
          {totalCapacity} total
        </Badge>
      </div>

      <div className="space-y-2">
        <p className="text-[13px] font-medium text-steel">
          Per-vehicle overrides
        </p>
        <div className="grid gap-2">
          {Array.from({ length: vehicles }, (_, index) => {
            const value = vehicleCapacities[index] ?? 20;
            return (
              <label
                key={index}
                className="flex items-center gap-3 rounded-md border border-hairline-soft px-3 py-2"
              >
                <span className="w-20 shrink-0 text-[13px] font-medium text-slate">
                  Vehicle {index + 1}
                </span>
                <input
                  type="number"
                  min={1}
                  value={value}
                  onChange={(e) =>
                    onVehicleCapacityChange(index, Number(e.target.value))
                  }
                  className={[
                    "min-w-0 flex-1 rounded-md border border-hairline-strong bg-canvas px-2 py-1 text-sm text-ink",
                    "transition-colors duration-150 ease-brand",
                    focusEdge,
                  ].join(" ")}
                />
              </label>
            );
          })}
        </div>
      </div>

      <p className="text-[13px] leading-5 text-steel">
        New vehicles inherit the previous capacity value. Overrides are sent to
        the backend per vehicle.
      </p>
    </div>
  );
}
