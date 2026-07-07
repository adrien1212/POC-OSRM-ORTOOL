export interface DeliveryPoint {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  quantity: number;
  stopType: StopType;
}

export interface AddressResult {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
}

export type DistanceMode = "real_road" | "straight_line";
export type VehicleProfile = "car" | "truck" | "bike";
export type Objective = "minimize_duration" | "minimize_distance";
export type StopType = "delivery" | "pickup";

export interface OptimizeOptions {
  distanceMode: DistanceMode;
  vehicleProfile: VehicleProfile;
  objective: Objective;
  returnGeometry: boolean;
}

export interface OptimizeRequestPoint {
  id: string;
  address: string;
  lat: number;
  lng: number;
  quantity: number;
  stopType: StopType;
}

export interface OptimizeRequest {
  vehicles: number;
  startPointId: string;
  endPointId: string;
  points: OptimizeRequestPoint[];
  options: OptimizeOptions;
}

export interface RouteStop {
  sequence: number;
  pointId: string;
}

export interface GeoLineString {
  type: "LineString";
  coordinates: [number, number][];
}

export interface OptimizedRoute {
  vehicleId: string;
  distanceMeters: number;
  durationSeconds: number;
  loadUnits: number;
  stops: RouteStop[];
  geometry: GeoLineString;
}

export interface OptimizeSummary {
  usedVehicles: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
}

export interface OptimizeResponse {
  summary: OptimizeSummary;
  routes: OptimizedRoute[];
}

export interface BackendOptimizeRouteRequest {
  depot: string;
  stops: BackendOptimizeRouteStopRequest[];
  vehicleCount: number;
  vehicleCapacities?: number[];
}

export interface BackendRouteStop {
  address: string;
  latitude: number;
  longitude: number;
}

export interface BackendOptimizeRouteStopRequest {
  address: string;
  quantity?: number;
  stopType?: StopType;
}

export interface BackendVehicleRoute {
  vehicleId: number;
  stops: BackendRouteStop[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  totalLoadUnits: number;
}

export interface BackendOptimizeRouteResponse {
  vehicles: BackendVehicleRoute[];
}
