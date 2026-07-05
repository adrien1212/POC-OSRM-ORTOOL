import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type {
  AddressResult,
  DeliveryPoint,
  OptimizeOptions,
} from "@/types";

let counter = 0;
function nextId(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

interface PlannerState {
  points: DeliveryPoint[];
  startPointId: string | null;
  endPointId: string | null;
  vehicles: number;
  options: OptimizeOptions;
  selectedRouteId: string | null;

  addPoint: (addr: AddressResult) => void;
  updatePoint: (id: string, patch: Partial<Omit<DeliveryPoint, "id">>) => void;
  deletePoint: (id: string) => void;
  setStartPointId: (id: string | null) => void;
  setEndPointId: (id: string | null) => void;
  setVehicles: (n: number) => void;
  setOptions: (patch: Partial<OptimizeOptions>) => void;
  setSelectedRouteId: (id: string | null) => void;
}

const PlannerContext = createContext<PlannerState | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [points, setPoints] = useState<DeliveryPoint[]>([]);
  const [startPointId, setStartPointId] = useState<string | null>(null);
  const [endPointId, setEndPointId] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState(1);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [options, setOptionsState] = useState<OptimizeOptions>({
    distanceMode: "real_road",
    vehicleProfile: "car",
    objective: "minimize_duration",
    returnGeometry: true,
  });

  const value = useMemo<PlannerState>(() => {
    return {
      points,
      startPointId,
      endPointId,
      vehicles,
      options,
      selectedRouteId,
      addPoint: (addr) => {
        const point: DeliveryPoint = {
          id: nextId("point"),
          address: addr.address,
          latitude: addr.latitude,
          longitude: addr.longitude,
        };
        setPoints((prev) => {
          const next = [...prev, point];
          // First point added becomes default depot (start + end).
          if (prev.length === 0) {
            setStartPointId(point.id);
            setEndPointId(point.id);
          }
          return next;
        });
      },
      updatePoint: (id, patch) =>
        setPoints((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        ),
      deletePoint: (id) => {
        setPoints((prev) => prev.filter((p) => p.id !== id));
        setStartPointId((cur) => (cur === id ? null : cur));
        setEndPointId((cur) => (cur === id ? null : cur));
      },
      setStartPointId,
      setEndPointId,
      setVehicles: (n) => setVehicles(Math.max(1, Math.floor(n || 1))),
      setOptions: (patch) => setOptionsState((prev) => ({ ...prev, ...patch })),
      setSelectedRouteId,
    };
  }, [points, startPointId, endPointId, vehicles, options, selectedRouteId]);

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used within PlannerProvider");
  return ctx;
}