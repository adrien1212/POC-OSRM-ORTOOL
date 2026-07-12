import type { DeliveryPoint, OptimizeResponse } from "@/types";
import { formatDistance, formatDuration } from "@/utils/format";
import { routeColor } from "@/utils/colors";
import { Clock, Package, Route as RouteIcon, Truck } from "lucide-react";

interface Props {
  result: OptimizeResponse;
  points: DeliveryPoint[];
  vehicleCapacities: number[];
  showCapacity: boolean;
  selectedRouteId: string | null;
  onSelectRoute: (id: string | null) => void;
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function RouteSummary({
  result,
  points,
  vehicleCapacities,
  showCapacity,
  selectedRouteId,
  onSelectRoute,
}: Props) {
  const pointById = new Map(points.map((p) => [p.id, p]));
  const deliveries = new Set(
    result.routes.flatMap((r) => r.stops.map((s) => s.pointId)),
  ).size;
  const totalLoad = result.routes.reduce(
    (sum, route) => Math.max(sum, route.loadUnits),
    0,
  );
  const fleetCapacity = vehicleCapacities.reduce((sum, cap) => sum + cap, 0);

  return (
    <div className="space-y-3">
      <div className={`grid grid-cols-2 gap-2 ${showCapacity ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
        <Stat
          icon={<RouteIcon className="h-3.5 w-3.5" />}
          label="Total distance"
          value={formatDistance(result.summary.totalDistanceMeters)}
        />
        <Stat
          icon={<Clock className="h-3.5 w-3.5" />}
          label="Total duration"
          value={formatDuration(result.summary.totalDurationSeconds)}
        />
        <Stat
          icon={<Truck className="h-3.5 w-3.5" />}
          label="Vehicles used"
          value={String(result.summary.usedVehicles)}
        />
        <Stat
          icon={<Package className="h-3.5 w-3.5" />}
          label="Visited stops"
          value={String(deliveries)}
        />
        {showCapacity && (
          <Stat
            icon={<Package className="h-3.5 w-3.5" />}
            label="Peak load"
            value={`${totalLoad} / ${fleetCapacity}`}
          />
        )}
      </div>

      <ul className="space-y-2">
        {result.routes.map((route, idx) => {
          const color = routeColor(idx);
          const selected = selectedRouteId === route.vehicleId;
          const capacity =
            vehicleCapacities[Number(route.vehicleId)] ?? 20;
          return (
            <li key={route.vehicleId}>
              <button
                type="button"
                onClick={() => onSelectRoute(selected ? null : route.vehicleId)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {route.vehicleId}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistance(route.distanceMeters)} ·{" "}
                    {formatDuration(route.durationSeconds)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                  {route.stops.map((s, i) => (
                    <span key={s.sequence} className="flex items-center gap-1">
                      <span className="truncate rounded bg-secondary px-1.5 py-0.5 text-secondary-foreground">
                        {pointById.get(s.pointId)?.address.split(",")[0] ?? s.pointId} 
                        {(pointById.get(s.pointId)?.serviceDurationMinutes ?? 0) > 0 && (
                          <> ({pointById.get(s.pointId)?.serviceDurationMinutes})</>
                        )}
                      </span>
                      {i < route.stops.length - 1 && <span>→</span>}
                    </span>
                  ))}
                </div>
                {showCapacity && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Peak load: {route.loadUnits} / {capacity}
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
