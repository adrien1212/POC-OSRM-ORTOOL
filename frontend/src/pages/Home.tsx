import { useState } from "react";
import { PlannerProvider, usePlanner } from "@/hooks/usePlannerStore";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { ClientOnly } from "@/components/ClientOnly";
import MapView from "@/components/Map/MapView";
import { Badge } from "@/components/ui/badge";
import type { OptimizeResponse } from "@/types";

const BRAND = "Cartographie";

/*
 * Top nav, per components/navigation/TopNav.prompt.md: 64px, opaque white,
 * wordmark left, utilities right, one hairline bottom border. Deliberately not
 * a frosted panel — the system has essentially no translucency.
 *
 * The design system ships no logo, so the wordmark renders in plain type
 * beside the documented yellow square placeholder tile.
 */
function TopBar() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-hairline bg-canvas px-6">
      <div className="flex items-center gap-3">
        <span aria-hidden className="h-7 w-7 rounded-md bg-brand-yellow" />
        <div className="leading-tight">
          <p className="text-[15px] font-semibold text-ink">{BRAND}</p>
          <p className="text-[13px] text-steel">
            Plan, visualize and optimize delivery routes
          </p>
        </div>
      </div>
      <Badge variant="neutral" className="hidden sm:inline-flex">
        OR-Tools backend ready
      </Badge>
    </header>
  );
}

function HomeInner() {
  const planner = usePlanner();
  const [result, setResult] = useState<OptimizeResponse | null>(null);

  return (
    <div className="flex h-screen flex-col bg-surface">
      <TopBar />

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[400px_1fr]">
        <div className="order-2 min-h-0 border-hairline md:order-1 md:h-full md:border-r">
          <Sidebar result={result} onResult={setResult} />
        </div>

        {/*
         * The map is this product's board. It gets the BoardMockup treatment —
         * 16px corners and --elev-3 — which is the only real shadow the brand
         * spends anywhere.
         */}
        <div className="order-1 h-[45vh] p-3 md:order-2 md:h-full">
          <div className="h-full overflow-hidden rounded-xl bg-canvas shadow-board">
            <ClientOnly
              fallback={
                <div className="flex h-full items-center justify-center bg-surface text-sm text-steel">
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
