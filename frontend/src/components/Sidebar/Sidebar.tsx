import { useMemo } from "react";
import { usePlanner } from "@/hooks/usePlannerStore";
import { useOptimize } from "@/hooks/useOptimize";
import type {
  BackendOptimizeRouteRequest,
  BackendOptimizeRouteResponse,
  DeliveryPoint,
  OptimizeResponse,
} from "@/types";
import { AddressSearch } from "@/components/AddressSearch/AddressSearch";
import { DeliveryList } from "@/components/DeliveryList/DeliveryList";
import { RouteSummary } from "@/components/RouteSummary/RouteSummary";
import { Section } from "./Section";
import { DepotSelector } from "./DepotSelector";
import { VehiclesConfig } from "./VehiclesConfig";
import { AlertCircle, Loader2, RotateCcw, Sparkles } from "lucide-react";

interface Props {
  result: OptimizeResponse | null;
  onResult: (r: OptimizeResponse | null) => void;
}

function validate(
  pointsLen: number,
  startId: string | null,
  endId: string | null,
  vehicles: number,
): string[] {
  const errors: string[] = [];
  if (pointsLen < 2) errors.push("Add at least two delivery points.");
  if (!startId) errors.push("Select a start depot.");
  if (!endId) errors.push("Select an end depot.");
  if (!Number.isInteger(vehicles) || vehicles < 1)
    errors.push("Vehicle count must be at least 1.");
  return errors;
}

export function Sidebar({ result, onResult }: Props) {
  const planner = usePlanner();
  const optimize = useOptimize();
  const pointByAddress = useMemo(() => {
    return new Map(planner.points.map((p) => [p.address, p] as const));
  }, [planner.points]);
  const startDepotLabel = displayDepotLabel(
    planner.points,
    planner.startPointId,
  );
  const endDepotLabel = displayDepotLabel(planner.points, planner.endPointId);

  const errors = useMemo(
    () =>
      validate(
        planner.points.length,
        planner.startPointId,
        planner.endPointId,
        planner.vehicles,
      ),
    [
      planner.points.length,
      planner.startPointId,
      planner.endPointId,
      planner.vehicles,
    ],
  );

  const canOptimize = errors.length === 0 && !optimize.isPending;

  async function handleOptimize() {
    if (!canOptimize) return;
    const depot = planner.points.find((p) => p.id === planner.startPointId);
    if (!depot) {
      onResult(null);
      return;
    }

    const req: BackendOptimizeRouteRequest = {
      depot: depot.address,
      addresses: planner.points
        .filter(
          (p) => p.id !== planner.startPointId && p.id !== planner.endPointId,
        )
        .map((p) => p.address),
      vehicleCount: planner.vehicles,
    };
    try {
      const res = await optimize.mutateAsync(req);
      onResult(mapBackendResponse(res, pointByAddress));
      planner.setSelectedRouteId(null);
    } catch {
      onResult(null);
    }
  }

  function clearResult() {
    onResult(null);
    optimize.reset();
    planner.setSelectedRouteId(null);
  }

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-r border-border bg-background">
      <div className="space-y-6 p-4">
        <Section title="Search address">
          <AddressSearch onSelect={planner.addPoint} />
        </Section>

        <Section title={`Delivery points (${planner.points.length})`}>
          <DeliveryList
            points={planner.points}
            startPointId={planner.startPointId}
            endPointId={planner.endPointId}
            onUpdate={planner.updatePoint}
            onDelete={planner.deletePoint}
          />
        </Section>

        <Section title="Depot configuration">
          <DepotSelector
            points={planner.points}
            startPointId={planner.startPointId}
            endPointId={planner.endPointId}
            onStartChange={planner.setStartPointId}
            onEndChange={planner.setEndPointId}
          />
        </Section>

        <Section title="Fleet">
          <VehiclesConfig
            vehicles={planner.vehicles}
            onChange={planner.setVehicles}
          />
        </Section>

        <Section title="Summary">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <SummaryRow
              label="Total points"
              value={String(planner.points.length)}
            />
            <SummaryRow label="Vehicles" value={String(planner.vehicles)} />
            <SummaryRow label="Start depot" value={startDepotLabel} />
            <SummaryRow label="End depot" value={endDepotLabel} />
          </dl>
        </Section>

        {errors.length > 0 && (
          <div className="space-y-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            {errors.map((e) => (
              <p
                key={e}
                className="flex items-center gap-2 text-xs text-destructive"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {e}
              </p>
            ))}
          </div>
        )}

        {optimize.isError && (
          <p className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            Optimization request failed. Please try again.
          </p>
        )}

        <button
          type="button"
          onClick={handleOptimize}
          disabled={!canOptimize}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {optimize.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {optimize.isPending ? "Optimizing…" : "Optimize Routes"}
        </button>

        {result && (
          <Section
            title="Optimized routes"
            action={
              <button
                type="button"
                onClick={clearResult}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Clear
              </button>
            }
          >
            <RouteSummary
              result={result}
              points={planner.points}
              selectedRouteId={planner.selectedRouteId}
              onSelectRoute={planner.setSelectedRouteId}
            />
          </Section>
        )}
      </div>
    </aside>
  );
}

function mapBackendResponse(
  response: BackendOptimizeRouteResponse,
  pointByAddress: Map<string, DeliveryPoint>,
): OptimizeResponse {
  const routes = response.vehicles.map((vehicle) => {
    const stops = vehicle.stops.map((stop, sequence) => {
      const matchedPoint = pointByAddress.get(stop.address);
      return {
        sequence,
        pointId: matchedPoint?.id ?? stop.address,
      };
    });

    const geometry = {
      type: "LineString" as const,
      coordinates: vehicle.stops.map(
        (stop) => [stop.longitude, stop.latitude] as [number, number],
      ),
    };

    return {
      vehicleId: String(vehicle.vehicleId),
      distanceMeters: Math.round(vehicle.totalDistanceMeters),
      durationSeconds: Math.round(vehicle.totalDurationSeconds),
      stops,
      geometry,
    };
  });

  const totalDistanceMeters = routes.reduce(
    (sum, route) => sum + route.distanceMeters,
    0,
  );
  const totalDurationSeconds = routes.reduce(
    (sum, route) => sum + route.durationSeconds,
    0,
  );

  return {
    summary: {
      usedVehicles: routes.length,
      totalDistanceMeters,
      totalDurationSeconds,
    },
    routes,
  };
}

function displayDepotLabel(
  points: DeliveryPoint[],
  pointId: string | null,
): string {
  const point = points.find((p) => p.id === pointId);
  return point?.address.split(",")[0] ?? "—";
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm font-semibold text-foreground">
        {value}
      </dd>
    </div>
  );
}
