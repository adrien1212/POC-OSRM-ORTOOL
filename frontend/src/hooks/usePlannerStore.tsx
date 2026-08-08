import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AddressResult, DeliveryPoint, OptimizeOptions } from "@/types";

let counter = 0;
function nextId(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

const DEMO_LOCATIONS: Array<[string, string, number, number]> = [
  ["Depot", "Rodez", 2.5734, 44.3526],
  ["A", "Baraqueville", 2.4318, 44.2766],
  ["B", "Flavin", 2.6032, 44.2889],
  ["C", "Saint-Côme-d'Olt", 2.814, 44.515],
  ["D", "Estaing", 2.671, 44.554],
  ["E", "Conques, 12330", 2.397, 44.599],
  ["F", "Valady", 2.427, 44.455],
  ["G", "Nauviale", 2.426, 44.52],
  ["H", "Firmi", 2.31, 44.54],
  ["I", "Cransac", 2.284, 44.525],
  ["J", "Balsac", 2.445, 44.401],
  ["K", "Villefranche-de-Rouergue", 2.037, 44.351],
  ["L", "Espalion", 2.757, 44.521],
  ["M", "Bozouls", 2.724, 44.47],
  ["N", "Laguiole", 2.846, 44.684],
  ["O", "Sévérac-d'Aveyron", 3.052, 44.323],
  ["P", "Millau", 3.081, 44.1],
  ["Q", "Saint-Affrique", 2.885, 43.958],
  ["R", "Pont-de-Salars", 2.728, 44.282],
  ["S", "Salles-Curan", 2.788, 44.182],
  ["T", "Réquista", 2.535, 44.033],
  ["U", "Decazeville", 2.251, 44.56],
  ["V", "Aubin", 2.243, 44.527],
  ["W", "Marcillac-Vallon", 2.465, 44.475],
  ["X", "Laissac", 2.683, 44.383],
  ["Y", "Rieupeyroux", 2.236, 44.305],
  ["Z", "Figeac", 2.034, 44.608],
  ["AA", "Cahors", 1.441, 44.449],
  ["AB", "Gourdon", 1.382, 44.736],
  ["AC", "Gramat", 1.722, 44.777],
  ["AD", "Saint-Céré", 1.892, 44.857],
  ["AE", "Souillac", 1.473, 44.896],
  ["AF", "Lacapelle-Marival", 1.924, 44.728],
  ["AG", "Limogne-en-Quercy", 1.771, 44.396],
  ["AH", "Puy-l'Évêque", 1.137, 44.504],
  ["AI", "Castelnau-Montratier", 1.355, 44.269],
  ["AJ", "Albi", 2.148, 43.928],
  ["AK", "Gaillac", 1.897, 43.902],
  ["AL", "Carmaux", 2.158, 44.049],
  ["AM", "Cordes-sur-Ciel", 1.954, 44.064],
  ["AN", "Graulhet", 1.989, 43.765],
  ["AO", "Lavaur", 1.812, 43.699],
  ["AP", "Castres", 2.24, 43.606],
  ["AQ", "Mazamet", 2.372, 43.492],
  ["AR", "Lisle-sur-Tarn", 1.812, 43.852],
  ["AS", "Rabastens", 1.725, 43.822],
];

const SHORT_DEMO_SERVICE_TIMES = [15, 10, 20, 5, 30, 12, 18, 8, 25];

function buildDemoPoints(limit: number) {
  return DEMO_LOCATIONS.slice(0, limit).map(
    ([id, address, longitude, latitude], index) => {
      const isDepot = index === 0;
      const serviceDurationMinutes = isDepot
        ? 0
        : (SHORT_DEMO_SERVICE_TIMES[index - 1] ?? 0);

      return {
        id: nextId(`demo-${id.toLowerCase()}`),
        address,
        latitude,
        longitude,
        quantity: isDepot ? 0 : 1,
        stopType: "delivery" as const,
        serviceDurationMinutes,
      };
    },
  );
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
  setMaximumDistance: (v: number) => void;
  setMaximumDuration: (v: number) => void;
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
        const demoPoints: DeliveryPoint[] = buildDemoPoints(
          DEMO_LOCATIONS.length,
        );
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

  return (
    <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>
  );
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used within PlannerProvider");
  return ctx;
}
