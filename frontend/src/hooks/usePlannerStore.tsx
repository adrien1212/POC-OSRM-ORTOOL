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
  vehicleCapacity: number;
  vehicleCapacities: number[];
  options: OptimizeOptions;
  selectedRouteId: string | null;

  addPoint: (addr: AddressResult) => void;
  updatePoint: (id: string, patch: Partial<Omit<DeliveryPoint, "id">>) => void;
  deletePoint: (id: string) => void;
  setStartPointId: (id: string | null) => void;
  setEndPointId: (id: string | null) => void;
  setVehicles: (n: number) => void;
  setVehicleCapacity: (n: number) => void;
  setVehicleCapacityAt: (index: number, capacity: number) => void;
  setOptions: (patch: Partial<OptimizeOptions>) => void;
  setSelectedRouteId: (id: string | null) => void;
}

const PlannerContext = createContext<PlannerState | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [points, setPoints] = useState<DeliveryPoint[]>([]);
  const [startPointId, setStartPointId] = useState<string | null>(null);
  const [endPointId, setEndPointId] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState(1);
  const [vehicleCapacity, setVehicleCapacity] = useState(20);
  const [vehicleCapacities, setVehicleCapacities] = useState<number[]>([20]);
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
      vehicleCapacity,
      vehicleCapacities,
      options,
      selectedRouteId,
      addPoint: (addr) => {
        setPoints((prev) => {
          const point: DeliveryPoint = {
            id: nextId("point"),
            address: addr.address,
            latitude: addr.latitude,
            longitude: addr.longitude,
            load: prev.length === 0 ? 0 : 1,
          };
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
      setVehicles: (n) =>
        setVehicles((prevVehicles) => {
          const nextVehicles = Math.max(1, Math.floor(n || 1));
          setVehicleCapacities((prevCapacities) => {
            const next = [...prevCapacities];
            if (nextVehicles > next.length) {
              for (let i = next.length; i < nextVehicles; i += 1) {
                next.push(vehicleCapacity);
              }
            } else if (nextVehicles < next.length) {
              next.length = nextVehicles;
            }
            return next;
          });
          return nextVehicles;
        }),
      setVehicleCapacity: (n) => {
        const nextCapacity = Math.max(1, Math.floor(n || 1));
        setVehicleCapacity(nextCapacity);
        setVehicleCapacities((prev) =>
          prev.map((cap) => (cap === vehicleCapacity ? nextCapacity : cap)),
        );
      },
      setVehicleCapacityAt: (index, capacity) =>
        setVehicleCapacities((prev) =>
          prev.map((cap, i) =>
            i === index ? Math.max(1, Math.floor(capacity || 1)) : cap,
          ),
        ),
      setOptions: (patch) => setOptionsState((prev) => ({ ...prev, ...patch })),
      setSelectedRouteId,
    };
  }, [
    points,
    startPointId,
    endPointId,
    vehicles,
    vehicleCapacity,
    vehicleCapacities,
    options,
    selectedRouteId,
  ]);

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used within PlannerProvider");
  return ctx;
}
