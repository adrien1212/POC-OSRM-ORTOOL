import type { DeliveryPoint, OptimizeResponse } from "@/types";
import { formatDistance, formatDuration } from "@/utils/format";
import { routeColor } from "@/utils/colors";
import { cardInteractive, cardSelected } from "@/lib/brand";
import { Clock, Package, Route as RouteIcon, Truck } from "lucide-react";

interface Props {
  result: OptimizeResponse;
  points: DeliveryPoint[];
  vehicleCapacities: number[];
  showCapacity: boolean;
  selectedRouteId: string | null;
  onSelectRoute: (id: string | null) => void;
}

/*
 * Stat tiles take the pastel feature-card treatment: 28px radius, saturated
 * fill, never a shadow ("their saturation is their weight"). They pair with
 * the white route cards below them, as the brand requires.
 *
 * Adaptation, flagged: the brand's StatCard renders values at 64px display
 * size. That is a marketing figure and unusable in a 380px tool sidebar, so
 * these run at the h4 step (22px) and keep the -0.5px tracking off.
 */
const TILE_TONES = [
  "bg-yellow-light text-yellow-dark",
  "bg-teal-light text-moss-dark",
  "bg-coral-light text-coral-dark",
  "bg-rose-light text-ink",
  "bg-orange-light text-ink",
] as const;

function StatTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className={`rounded-3xl p-4 ${tone}`}>
      <div className="flex items-center gap-1.5 text-[13px] font-medium opacity-80">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-[22px] font-semibold leading-tight">{value}</p>
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
  const peakLoad = result.routes.reduce(
    (max, route) => Math.max(max, route.loadUnits),
    0,
  );
  const fleetCapacity = vehicleCapacities.reduce((sum, cap) => sum + cap, 0);

  const tiles = [
    {
      icon: <RouteIcon className="h-[18px] w-[18px]" />,
      label: "Total distance",
      value: formatDistance(result.summary.totalDistanceMeters),
    },
    {
      icon: <Clock className="h-[18px] w-[18px]" />,
      label: "Total duration",
      value: formatDuration(result.summary.totalDurationSeconds),
    },
    {
      icon: <Truck className="h-[18px] w-[18px]" />,
      label: "Vehicles used",
      value: String(result.summary.usedVehicles),
    },
    {
      icon: <Package className="h-[18px] w-[18px]" />,
      label: "Visited stops",
      value: String(deliveries),
    },
    ...(showCapacity
      ? [
          {
            icon: <Package className="h-[18px] w-[18px]" />,
            label: "Peak load",
            value: `${peakLoad} / ${fleetCapacity}`,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {tiles.map((tile, idx) => (
          <StatTile
            key={tile.label}
            icon={tile.icon}
            label={tile.label}
            value={tile.value}
            tone={TILE_TONES[idx % TILE_TONES.length]}
          />
        ))}
      </div>

      <ul className="space-y-2">
        {result.routes.map((route, idx) => {
          const color = routeColor(idx);
          const selected = selectedRouteId === route.vehicleId;
          const capacity = vehicleCapacities[Number(route.vehicleId)] ?? 20;
          return (
            <li key={route.vehicleId}>
              <button
                type="button"
                onClick={() => onSelectRoute(selected ? null : route.vehicleId)}
                aria-pressed={selected}
                className={[
                  "w-full p-3 text-left",
                  // A 2px blue edge marks the selected route — the same
                  // treatment the brand gives its one featured pricing card.
                  selected ? cardSelected : cardInteractive,
                  "outline-none focus-visible:border-brand-blue",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    Vehicle {route.vehicleId}
                  </span>
                  <span className="shrink-0 text-[13px] text-steel">
                    {formatDistance(route.distanceMeters)} ·{" "}
                    {formatDuration(route.durationSeconds)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1 text-[13px] text-steel">
                  {route.stops.map((s, i) => {
                    const point = pointById.get(s.pointId);
                    const service = point?.serviceDurationMinutes ?? 0;
                    return (
                      <span
                        key={s.sequence}
                        className="flex items-center gap-1"
                      >
                        <span className="truncate rounded-full bg-surface px-2 py-0.5 text-slate">
                          {point?.address.split(",")[0] ?? s.pointId}
                          {service > 0 && <> ({service})</>}
                        </span>
                        {i < route.stops.length - 1 && (
                          <span className="text-stone">→</span>
                        )}
                      </span>
                    );
                  })}
                </div>
                {showCapacity && (
                  <p className="mt-2 text-[13px] text-steel">
                    Peak load: {route.loadUnits} / {capacity}
                  </p>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
