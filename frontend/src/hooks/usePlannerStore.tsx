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

const DEMO_LOCATIONS: Array<[string, string, number, number]> = [
  ["Depot", "Rodez", 2.5734, 44.3526],
  ["A", "Baraqueville", 2.4318, 44.2766],
  ["B", "Flavin", 2.6032, 44.2889],
  ["C", "Saint-Côme-d'Olt", 2.8140, 44.5150],
  ["D", "Estaing", 2.6710, 44.5540],
  ["E", "Conques, 12330", 2.3970, 44.5990],
  ["F", "Valady", 2.4270, 44.4550],
  ["G", "Nauviale", 2.4260, 44.5200],
  ["H", "Firmi", 2.3100, 44.5400],
  ["I", "Cransac", 2.2840, 44.5250],
  ["J", "Balsac", 2.4450, 44.4010],
  ["K", "Villefranche-de-Rouergue", 2.0370, 44.3510],
  ["L", "Espalion", 2.7570, 44.5210],
  ["M", "Bozouls", 2.7240, 44.4700],
  ["N", "Laguiole", 2.8460, 44.6840],
  ["O", "Sévérac-d'Aveyron", 3.0520, 44.3230],
  ["P", "Millau", 3.0810, 44.1000],
  ["Q", "Saint-Affrique", 2.8850, 43.9580],
  ["R", "Pont-de-Salars", 2.7280, 44.2820],
  ["S", "Salles-Curan", 2.7880, 44.1820],
  ["T", "Réquista", 2.5350, 44.0330],
  ["U", "Decazeville", 2.2510, 44.5600],
  ["V", "Aubin", 2.2430, 44.5270],
  ["W", "Marcillac-Vallon", 2.4650, 44.4750],
  ["X", "Laissac", 2.6830, 44.3830],
  ["Y", "Rieupeyroux", 2.2360, 44.3050],
  ["Z", "Figeac", 2.0340, 44.6080],
  ["AA", "Cahors", 1.4410, 44.4490],
  ["AB", "Gourdon", 1.3820, 44.7360],
  ["AC", "Gramat", 1.7220, 44.7770],
  ["AD", "Saint-Céré", 1.8920, 44.8570],
  ["AE", "Souillac", 1.4730, 44.8960],
  ["AF", "Lacapelle-Marival", 1.9240, 44.7280],
  ["AG", "Limogne-en-Quercy", 1.7710, 44.3960],
  ["AH", "Puy-l'Évêque", 1.1370, 44.5040],
  ["AI", "Castelnau-Montratier", 1.3550, 44.2690],
  ["AJ", "Albi", 2.1480, 43.9280],
  ["AK", "Gaillac", 1.8970, 43.9020],
  ["AL", "Carmaux", 2.1580, 44.0490],
  ["AM", "Cordes-sur-Ciel", 1.9540, 44.0640],
  ["AN", "Graulhet", 1.9890, 43.7650],
  ["AO", "Lavaur", 1.8120, 43.6990],
  ["AP", "Castres", 2.2400, 43.6060],
  ["AQ", "Mazamet", 2.3720, 43.4920],
  ["AR", "Lisle-sur-Tarn", 1.8120, 43.8520],
  ["AS", "Rabastens", 1.7250, 43.8220],
];

const SHORT_DEMO_SERVICE_TIMES = [15, 10, 20, 5, 30, 12, 18, 8, 25];

function buildDemoPoints(limit: number) {
  return DEMO_LOCATIONS.slice(0, limit).map(([id, address, longitude, latitude], index) => {
    const isDepot = index === 0;
    const serviceDurationMinutes = isDepot
      ? 0
      : SHORT_DEMO_SERVICE_TIMES[index - 1] ?? 0;

    return {
      id: nextId(`demo-${id.toLowerCase()}`),
      address,
      latitude,
      longitude,
      quantity: isDepot ? 0 : 1,
      stopType: "delivery" as const,
      serviceDurationMinutes,
    };
  });
}

interface PlannerState {
  points: DeliveryPoint[];
  startPointId: string | null;
  endPointId: string | null;
  vehicles: number;
  vehicleCapacities: number[];
  capacityEnabled: boolean;
  useAllVehicule: boolean;
  optimizationMode: string;
  computationTime: number;
  options: OptimizeOptions;
  selectedRouteId: string | null;
  maximumDistance: number;
  maximumDuration: number;
  addPoint: (addr: AddressResult) => void;
  updatePoint: (id: string, patch: Partial<Omit<DeliveryPoint, "id">>) => void;
  deletePoint: (id: string) => void;
  setStartPointId: (id: string | null) => void;
  setEndPointId: (id: string | null) => void;
  setVehicles: (n: number) => void;
  setVehicleCapacityAt: (index: number, capacity: number) => void;
  setCapacityEnabled: (enabled: boolean) => void;
  setUseAllVehicule: (enabled: boolean) => void;
  setOptimizationMode: (value: string) => void;
  setComputationTime: (value: number) => void;
  loadDemo: () => void;
  loadShortDemo: () => void;
  setOptions: (patch: Partial<OptimizeOptions>) => void;
  setSelectedRouteId: (id: string | null) => void;
  setMaximumDistance:(v: number) => void
  setMaximumDuration:(v: number) => void
}

const PlannerContext = createContext<PlannerState | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [points, setPoints] = useState<DeliveryPoint[]>([]);
  const [startPointId, setStartPointId] = useState<string | null>(null);
  const [endPointId, setEndPointId] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState(1);
  const [vehicleCapacities, setVehicleCapacities] = useState<number[]>([20]);
  const [maximumDistance, setMaximumDistance] = useState<number>(2000);
  const [maximumDuration, setMaximumDuration] = useState<number>(24);
  const [computationTime, setComputationTime] = useState<number>(5);

  const [capacityEnabled, setCapacityEnabled] = useState(false);
  const [useAllVehicule, setUseAllVehicule] = useState(false);
  const [optimizationMode, setOptimizationMode] = useState<string>("distance");
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
      vehicleCapacities,
      capacityEnabled,
      useAllVehicule,
      optimizationMode,
      computationTime,
      maximumDistance,
      maximumDuration,
      options,
      selectedRouteId,
      addPoint: (addr) => {
        setPoints((prev) => {
          const point: DeliveryPoint = {
            id: nextId("point"),
            address: addr.address,
            latitude: addr.latitude,
            longitude: addr.longitude,
            quantity: prev.length === 0 ? 0 : 1,
            stopType: "delivery",
            serviceDurationMinutes: 0,
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
                next.push(next[next.length - 1] ?? 20);
              }
            } else if (nextVehicles < next.length) {
              next.length = nextVehicles;
            }
            return next;
          });
          return nextVehicles;
        }),
      setVehicleCapacityAt: (index, capacity) =>
        setVehicleCapacities((prev) =>
          prev.map((cap, i) =>
            i === index ? Math.max(1, Math.floor(capacity || 1)) : cap,
          ),
        ),
      setCapacityEnabled,
      setUseAllVehicule,
      setOptimizationMode,
      setComputationTime,
      setMaximumDistance,
      setMaximumDuration,
      loadDemo: () => {
        const demoPoints: DeliveryPoint[] = buildDemoPoints(DEMO_LOCATIONS.length);
        setPoints(demoPoints);
        setStartPointId(demoPoints[0]?.id ?? null);
        setEndPointId(demoPoints[0]?.id ?? null);
        setVehicles(8);
        setVehicleCapacities(Array.from({ length: 8 }, () => 20));
        setCapacityEnabled(false);
        setUseAllVehicule(false);
        setOptimizationMode("distance");
        setComputationTime(5);
        setSelectedRouteId(null);
      },
      loadShortDemo: () => {
        const demoPoints: DeliveryPoint[] = buildDemoPoints(10);
        setPoints(demoPoints);
        setStartPointId(demoPoints[0]?.id ?? null);
        setEndPointId(demoPoints[0]?.id ?? null);
        setVehicles(3);
        setVehicleCapacities(Array.from({ length: 3 }, () => 20));
        setCapacityEnabled(false);
        setUseAllVehicule(false);
        setOptimizationMode("distance");
        setComputationTime(5);
        setSelectedRouteId(null);
      },
      setOptions: (patch) => setOptionsState((prev) => ({ ...prev, ...patch })),
      setSelectedRouteId,
    };
  }, [
    points,
    startPointId,
    endPointId,
    vehicles,
    vehicleCapacities,
    maximumDistance,
    maximumDuration,
    capacityEnabled,
    useAllVehicule,
    optimizationMode,
    computationTime,
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
