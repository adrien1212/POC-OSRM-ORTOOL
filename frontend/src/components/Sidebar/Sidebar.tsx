import { useEffect, useMemo, useRef, useState } from "react";
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
import { CapacityConfig } from "./CapacityConfig";
import { NumberConfig } from "./NumberConfig";
import { VehiclesConfig } from "./VehiclesConfig";
import { AlertCircle, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "../ui/button";

interface Props {
  result: OptimizeResponse | null;
  onResult: (r: OptimizeResponse | null) => void;
}

function validate(
  pointsLen: number,
  startId: string | null,
  vehicles: number,
  vehicleCapacities: number[],
  capacityEnabled: boolean,
  maxStopDemand: number,
): string[] {
  const errors: string[] = [];
  if (pointsLen < 2) errors.push("Add at least two delivery points.");
  if (!startId) errors.push("Select a start depot.");
  if (!Number.isInteger(vehicles) || vehicles < 1)
    errors.push("Vehicle count must be at least 1.");
  if (capacityEnabled) {
    if (vehicleCapacities.length !== vehicles) {
      errors.push("Each vehicle must have a capacity value.");
    }
    if (vehicleCapacities.some((cap) => !Number.isInteger(cap) || cap < 1)) {
      errors.push("Each vehicle capacity must be at least 1.");
    }
    const maxSingleVehicleCapacity = Math.max(...vehicleCapacities, 0);
    if (maxStopDemand > maxSingleVehicleCapacity) {
      errors.push("One stop exceeds the capacity of every vehicle.");
    }
  }
  return errors;
}

export function Sidebar({ result, onResult }: Props) {
  const planner = usePlanner();
  const optimize = useOptimize();
  const [fakeProgress, setFakeProgress] = useState(0);
  const progressTimerRef = useRef<number | null>(null);
  const pointByAddress = useMemo(() => {
    return new Map(planner.points.map((p) => [p.address, p] as const));
  }, [planner.points]);
  const deliveryPoints = useMemo(
    () =>
      planner.points.filter((p) => p.id !== planner.startPointId),
    [planner.points, planner.startPointId],
  );
  const totalDemand = useMemo(
    () => deliveryPoints.reduce((sum, point) => sum + point.quantity, 0),
    [deliveryPoints],
  );
  const maxStopDemand = useMemo(
    () => deliveryPoints.reduce((max, point) => Math.max(max, point.quantity), 0),
    [deliveryPoints],
  );
  const totalCapacity = useMemo(
    () =>
      planner.vehicleCapacities.reduce((sum, cap) => sum + cap, 0),
    [planner.vehicleCapacities],
  );
  const maxVehicleCapacity = useMemo(
    () => Math.max(...planner.vehicleCapacities, 0),
    [planner.vehicleCapacities],
  );
  const startDepotLabel = displayDepotLabel(
    planner.points,
    planner.startPointId,
  );

  const errors = useMemo(
    () =>
      validate(
        planner.points.length,
        planner.startPointId,
        planner.vehicles,
        planner.vehicleCapacities,
        planner.capacityEnabled,
        maxStopDemand,
      ),
    [
      planner.points.length,
      planner.startPointId,
      planner.vehicles,
      planner.vehicleCapacities,
      planner.capacityEnabled,
      maxStopDemand,
    ],
  );

  const canOptimize = errors.length === 0 && !optimize.isPending;

  useEffect(() => {
    if (progressTimerRef.current !== null) {
      window.clearTimeout(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    if (!optimize.isPending) {
      setFakeProgress(0);
      return;
    }

    const fakeWindowMs = Math.max(1000, planner.computationTime * 1500);
    const start = performance.now();
    setFakeProgress(0);

    const step = () => {
      const elapsed = performance.now() - start;
      const warmupMs = Math.min(1800, fakeWindowMs * 0.4);
      const easedElapsed = Math.max(0, elapsed - warmupMs);
      const easedWindow = Math.max(1, fakeWindowMs - warmupMs);
      const targetProgress = Math.min(95, (easedElapsed / easedWindow) * 95);
      setFakeProgress((current) => {
        if (current >= 95) return 95;
        if (elapsed < warmupMs) {
          return Math.min(current + 0.3 + Math.random() * 0.7, 3);
        }
        const remaining = Math.max(targetProgress - current, 0);
        const jump =
          current < 20
            ? 0.5 + Math.random() * 1
            : current < 45
              ? 1.5 + Math.random() * 2
              : current < 75
                ? 2 + Math.random() * 2.5
                : 1 + Math.random() * 1.5;
        return Math.min(95, current + Math.max(jump, remaining > 0 ? remaining * 0.18 : 0));
      });

      const elapsedAfterStep = performance.now() - start;
      if (elapsedAfterStep < fakeWindowMs) {
        let nextDelay = 120 + Math.random() * 220;
        if (elapsedAfterStep < warmupMs) {
          nextDelay = 520 + Math.random() * 300;
        } else if (elapsedAfterStep < fakeWindowMs * 0.5) {
          nextDelay = 220 + Math.random() * 180;
        } else if (elapsedAfterStep < fakeWindowMs * 0.8) {
          nextDelay = 120 + Math.random() * 130;
        } else {
          nextDelay = 80 + Math.random() * 90;
        }
        progressTimerRef.current = window.setTimeout(step, nextDelay);
      }
    };

    progressTimerRef.current = window.setTimeout(step, 800);

    return () => {
      if (progressTimerRef.current !== null) {
        window.clearTimeout(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [optimize.isPending, planner.computationTime]);

  async function handleOptimize() {
    if (!canOptimize) return;
    const depot = planner.points.find((p) => p.id === planner.startPointId);
    if (!depot) {
      onResult(null);
      return;
    }

    const req: BackendOptimizeRouteRequest = {
      depot: depot.address,
      stops: planner.points
        .filter((p) => p.id !== planner.startPointId)
        .map((p) =>
          planner.capacityEnabled
            ? {
                address: p.address,
                quantity: p.quantity,
                stopType: p.stopType,
                serviceDurationMinutes: p.serviceDurationMinutes,
              }
            : {
                address: p.address,
                serviceDurationMinutes: p.serviceDurationMinutes,
              },
        ),
      vehicleCount: planner.vehicles,
      vehicleCapacities: planner.capacityEnabled ? planner.vehicleCapacities : undefined,
      isUseAllVehicule: planner.useAllVehicule,
      maximumDistance: planner.maximumDistance,
      maximumDuration: planner.maximumDuration,
      computationTime: planner.computationTime,
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
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={planner.loadDemo}
              className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
            >
              Load demo
            </button>
            <button
              type="button"
              onClick={planner.loadShortDemo}
              className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
            >
              Load 10-point demo
            </button>
          </div>
          <AddressSearch onSelect={planner.addPoint} />
        </Section>

        <Section title={`Delivery points (${planner.points.length})`}>
          <DeliveryList
            points={planner.points}
            startPointId={planner.startPointId}
            maxVehicleCapacity={maxVehicleCapacity}
            showDemand={planner.capacityEnabled}
            onUpdate={planner.updatePoint}
            onDelete={planner.deletePoint}
          />
        </Section>

        <Section title="Depot configuration">
          <DepotSelector
            points={planner.points}
            startPointId={planner.startPointId}
            onStartChange={(id) => {
              planner.setStartPointId(id);
              planner.setEndPointId(id);
            }}
          />
        </Section>

        <Section title="Settings">
{/*           <div className="space-y-3 rounded-xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Optimization objective
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  Choose whether the solver should favor shorter distance or shorter duration.
                </p>
              </div>
              <span className="rounded-full bg-secondary px-2 py-1 text-[11px] font-medium text-secondary-foreground">
                {planner.optimizationMode === "duration" ? "Duration" : "Distance"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <ModeButton
                active={planner.optimizationMode === "distance"}
                onClick={() => planner.setOptimizationMode("distance")}
                title="Distance"
                subtitle="Best for shortest route"
              />
              <ModeButton
                active={planner.optimizationMode === "duration"}
                onClick={() => planner.setOptimizationMode("duration")}
                title="Duration"
                subtitle="Best for fastest route"
              />
            </div>
          </div> */}

          <NumberConfig
            title={"Maximum distance (km)"}
            quantity={planner.maximumDistance}
            onChange={planner.setMaximumDistance}
          />

          <NumberConfig
            title={"Maximum distance (heures)"}
            quantity={planner.maximumDuration}
            onChange={planner.setMaximumDuration}
          />



          <div className="space-y-3 rounded-xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Computation time
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  Maximum solver time to find the best solution in seconds.
                </p>
              </div>
              <span className="rounded-full bg-secondary px-2 py-1 text-[11px] font-medium text-secondary-foreground">
                {planner.computationTime}s
              </span>
            </div>
            <div className="space-y-2">
              <Slider
                value={[planner.computationTime]}
                min={1}
                max={60}
                step={1}
                onValueChange={([value]) =>
                  planner.setComputationTime(value ?? 1)
                }
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>1s</span>
                <span>60s</span>
              </div>
            </div>
          </div>
        </Section>


        <Section title="Fleet">
          <NumberConfig
            title={"Vehicules"}
            quantity={planner.vehicles}
            onChange={planner.setVehicles}
          />
          <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-foreground">Use all vehicles</p>
              <p className="text-xs text-muted-foreground">
                Force the solver to assign at least one stop to every vehicle.
              </p>
            </div>
            <Switch
              checked={planner.useAllVehicule}
              onCheckedChange={planner.setUseAllVehicule}
            />
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-foreground">Capacity constraints</p>
              <p className="text-xs text-muted-foreground">
                Enable demand and vehicle capacity checks.
              </p>
            </div>
            <Switch
              checked={planner.capacityEnabled}
              onCheckedChange={planner.setCapacityEnabled}
            />
          </div>
          {planner.capacityEnabled && (
            <div className="pt-3">
              <CapacityConfig
                vehicles={planner.vehicles}
                vehicleCapacities={planner.vehicleCapacities}
                onVehicleCapacityChange={planner.setVehicleCapacityAt}
              />
            </div>
          )}
        </Section>

        <Section title="Summary">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <SummaryRow
              label="Total points"
              value={String(planner.points.length)}
            />
            <SummaryRow label="Vehicles" value={String(planner.vehicles)} />
            {planner.capacityEnabled ? (
              <>
                <SummaryRow
                  label="Total quantity"
                  value={String(totalDemand)}
                />
                <SummaryRow label="Fleet cap." value={String(totalCapacity)} />
              </>
            ) : (
              <SummaryRow label="Capacity mode" value="Off" />
            )}
            <SummaryRow label="Start depot" value={startDepotLabel} />
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
        <div className="h-2 overflow-hidden rounded-full bg-secondary/70">
          <div
            className="h-full rounded-full bg-primary transition-all duration-200 ease-out"
            style={{ width: `${fakeProgress}%` }}
          />
        </div>

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
              vehicleCapacities={planner.vehicleCapacities}
              showCapacity={planner.capacityEnabled}
              selectedRouteId={planner.selectedRouteId}
              onSelectRoute={planner.setSelectedRouteId}
            />
            <button 
              type="button"
              onClick={
                () => planner.setSelectedRouteId(null)
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
              View all routes
            </button>
          </Section>
        )}
      </div>
    </aside>
  );
}

function ModeButton({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-lg border px-3 py-2 text-left transition-colors",
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-foreground",
      ].join(" ")}
    >
      <span className="block text-sm font-semibold">{title}</span>
      <span className="mt-0.5 block text-xs leading-5">{subtitle}</span>
    </button>
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
      loadUnits: Math.round(vehicle.totalLoadUnits),
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
