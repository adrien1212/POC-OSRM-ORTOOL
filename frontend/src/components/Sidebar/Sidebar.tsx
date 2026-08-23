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
import {
  AlertCircle,
  Clock,
  Loader2,
  RotateCcw,
  Route,
  Truck,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cardBase, cardSelected, cardInteractive } from "@/lib/brand";

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
    () => planner.points.filter((p) => p.id !== planner.startPointId),
    [planner.points, planner.startPointId],
  );
  const totalDemand = useMemo(
    () => deliveryPoints.reduce((sum, point) => sum + point.quantity, 0),
    [deliveryPoints],
  );
  const maxStopDemand = useMemo(
    () =>
      deliveryPoints.reduce((max, point) => Math.max(max, point.quantity), 0),
    [deliveryPoints],
  );
  const totalCapacity = useMemo(
    () => planner.vehicleCapacities.reduce((sum, cap) => sum + cap, 0),
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
        return Math.min(
          95,
          current + Math.max(jump, remaining > 0 ? remaining * 0.18 : 0),
        );
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
      vehicleCapacities: planner.capacityEnabled
        ? planner.vehicleCapacities
        : undefined,
      isUseAllVehicule: planner.useAllVehicule,
      objective:
        planner.optimizationMode === "duration" ? "duration" : "distance",
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
    <aside className="flex h-full w-full flex-col overflow-y-auto bg-canvas">
      <div className="space-y-7 p-4">
        <Section
          title="Search address"
          action={
            <div className="flex gap-2">
              <Button size="xs" variant="secondary" onClick={planner.loadDemo}>
                Load demo
              </Button>
              <Button
                size="xs"
                variant="secondary"
                onClick={planner.loadShortDemo}
              >
                Load 10 points
              </Button>
            </div>
          }
        >
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

        <Section title="Depot">
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
          <div className={`${cardBase} space-y-3 p-3`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">
                  Optimization objective
                </p>
                <p className="text-[13px] leading-5 text-steel">
                  Favor the shortest route or the fastest one.
                </p>
              </div>
              <Badge variant="neutral" size="sm" className="shrink-0">
                {planner.optimizationMode === "duration"
                  ? "Duration"
                  : "Distance"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <ModeButton
                active={planner.optimizationMode === "distance"}
                onClick={() => planner.setOptimizationMode("distance")}
                icon={<Route className="h-[18px] w-[18px]" />}
                title="Distance"
                subtitle="Shortest total route"
              />
              <ModeButton
                active={planner.optimizationMode === "duration"}
                onClick={() => planner.setOptimizationMode("duration")}
                icon={<Clock className="h-[18px] w-[18px]" />}
                title="Duration"
                subtitle="Fastest total route"
              />
            </div>
          </div>

          <NumberConfig
            title="Maximum distance (km)"
            icon={Route}
            quantity={planner.maximumDistance}
            onChange={planner.setMaximumDistance}
          />

          <NumberConfig
            title="Maximum duration (hours)"
            icon={Clock}
            quantity={planner.maximumDuration}
            onChange={planner.setMaximumDuration}
          />

          <div className={`${cardBase} space-y-3 p-3`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">
                  Computation time
                </p>
                <p className="text-[13px] leading-5 text-steel">
                  How long the solver may search, in seconds.
                </p>
              </div>
              <Badge variant="neutral" size="sm" className="shrink-0">
                {planner.computationTime}s
              </Badge>
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
              <div className="flex justify-between text-[11px] text-stone">
                <span>1s</span>
                <span>60s</span>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Fleet">
          <NumberConfig
            title="Vehicles"
            icon={Truck}
            quantity={planner.vehicles}
            onChange={planner.setVehicles}
          />
          <ToggleRow
            title="Use all vehicles"
            description="Force the solver to assign at least one stop to every vehicle."
            checked={planner.useAllVehicule}
            onCheckedChange={planner.setUseAllVehicule}
          />
          <ToggleRow
            title="Capacity constraints"
            description="Enable demand and vehicle capacity checks."
            checked={planner.capacityEnabled}
            onCheckedChange={planner.setCapacityEnabled}
          />
          {planner.capacityEnabled && (
            <CapacityConfig
              vehicles={planner.vehicles}
              vehicleCapacities={planner.vehicleCapacities}
              onVehicleCapacityChange={planner.setVehicleCapacityAt}
            />
          )}
        </Section>

        <Section title="Summary">
          <dl className="grid grid-cols-2 gap-2">
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
                <SummaryRow
                  label="Fleet capacity"
                  value={String(totalCapacity)}
                />
              </>
            ) : (
              <SummaryRow label="Capacity mode" value="Off" />
            )}
            <SummaryRow label="Start depot" value={startDepotLabel} />
          </dl>
        </Section>

        {errors.length > 0 && (
          <div className="space-y-1.5 rounded-xl bg-brand-red p-3">
            {errors.map((e) => (
              <p
                key={e}
                className="flex items-start gap-2 text-[13px] leading-5 text-coral-dark"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {e}
              </p>
            ))}
          </div>
        )}

        {optimize.isError && (
          <p className="flex items-start gap-2 rounded-xl bg-brand-red p-3 text-[13px] leading-5 text-coral-dark">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            The optimization request failed. Please try again.
          </p>
        )}

        <div className="space-y-2">
          <Button
            size="lg"
            className="w-full"
            onClick={handleOptimize}
            disabled={!canOptimize}
          >
            {optimize.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {optimize.isPending ? "Optimizing" : "Optimize routes"}
          </Button>

          {optimize.isPending ? (
            <div className="h-1.5 overflow-hidden rounded-full bg-hairline">
              <div
                className="h-full rounded-full bg-ink transition-all duration-200 ease-brand"
                style={{ width: `${fakeProgress}%` }}
              />
            </div>
          ) : (
            // Reassurance sits below the button as caption text, never inside it.
            <p className="text-center text-[13px] text-steel">
              Runs for up to {planner.computationTime}s. Nothing is saved.
            </p>
          )}
        </div>

        {result && (
          <Section
            title="Optimized routes"
            action={
              <button
                type="button"
                onClick={clearResult}
                className="flex items-center gap-1 rounded-full px-2 py-1 text-[13px] font-medium text-steel transition-colors duration-150 ease-brand hover:bg-hairline-soft hover:text-ink"
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
            <Button
              variant="secondary"
              className="w-full"
              disabled={planner.selectedRouteId === null}
              onClick={() => planner.setSelectedRouteId(null)}
            >
              View all routes
            </Button>
          </Section>
        )}
      </div>
    </aside>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div
      className={`${cardBase} flex items-center justify-between gap-3 px-3 py-2.5`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="text-[13px] leading-5 text-steel">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "px-3 py-2.5 text-left",
        active ? cardSelected : cardInteractive,
        "outline-none focus-visible:border-brand-blue",
      ].join(" ")}
    >
      <span
        className={`flex items-center gap-2 text-sm font-semibold ${active ? "text-ink" : "text-slate"}`}
      >
        <span className={active ? "text-brand-blue" : "text-stone"}>
          {icon}
        </span>
        {title}
      </span>
      <span className="mt-0.5 block text-[13px] leading-5 text-steel">
        {subtitle}
      </span>
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
    <div className={`${cardBase} px-3 py-2`}>
      <dt className="text-[13px] text-steel">{label}</dt>
      <dd className="truncate text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}
