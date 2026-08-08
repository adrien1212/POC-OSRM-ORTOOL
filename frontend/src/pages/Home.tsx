import { useState } from "react";
import { PlannerProvider, usePlanner } from "@/hooks/usePlannerStore";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { ClientOnly } from "@/components/ClientOnly";
import MapView from "@/components/Map/MapView";
import type { OptimizeResponse } from "@/types";
import { Navigation } from "lucide-react";

function HomeInner() {
  const planner = usePlanner();
  const [result, setResult] = useState<OptimizeResponse | null>(null);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Toolbar */}
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Navigation className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-base font-semibold leading-tight text-foreground">
              Vehicle Routing Planner
            </h1>
            <p className="text-xs text-muted-foreground">
              Plan, visualize & optimize delivery routes
            </p>
          </div>
        </div>
        <span className="hidden rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground sm:inline">
          OR-Tools backend ready
        </span>
      </header>

      {/* Body */}
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[380px_1fr]">
        <div className="order-2 min-h-0 md:order-1 md:h-full">
          <Sidebar result={result} onResult={setResult} />
        </div>
        <div className="order-1 h-[45vh] md:order-2 md:h-full">
          <ClientOnly
            fallback={
              <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
                Loading map…
              </div>
            }
          >
            <MapView
              points={planner.points}
              startPointId={planner.startPointId}
              endPointId={planner.endPointId}
              result={result}
              selectedRouteId={planner.selectedRouteId}
              onSelectRoute={planner.setSelectedRouteId}
            />
          </ClientOnly>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <PlannerProvider>
      <HomeInner />
    </PlannerProvider>
  );
}
