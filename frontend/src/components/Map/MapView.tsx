import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { DeliveryPoint, OptimizeResponse } from "@/types";
import {
  deliveryIcon,
  depotIcon,
  endIcon,
  startIcon,
  stopIcon,
} from "@/utils/mapIcons";
import { routeColor } from "@/utils/colors";
import { formatCoords } from "@/utils/format";
import { Crosshair, Maximize } from "lucide-react";

const PARIS: [number, number] = [48.8566, 2.3522];
const OSRM_BASE_URL = import.meta.env.VITE_OSRM_BASE_URL;

type LatLngTuple = [number, number];

interface MapViewProps {
  points: DeliveryPoint[];
  startPointId: string | null;
  endPointId: string | null;
  result: OptimizeResponse | null;
  selectedRouteId: string | null;
  onSelectRoute: (id: string | null) => void;
}

function FitBounds({ points }: { points: DeliveryPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [p.latitude, p.longitude]));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    // run only when the number of points changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.length]);
  return null;
}

function MapControls({ points }: { points: DeliveryPoint[] }) {
  const map = useMap();
  const fitAll = () => {
    if (points.length === 0) {
      map.setView(PARIS, 12);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.latitude, p.longitude]));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
  };
  const reset = () => map.setView(PARIS, 12);

  /* Floating utility controls: circular IconButtons on an opaque white
     surface, taking the overlay elevation the brand reserves for panels that
     sit above content. */
  const control = [
    "flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-canvas text-ink",
    "shadow-overlay transition-colors duration-150 ease-brand",
    "hover:bg-hairline-soft active:bg-hairline",
    "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
  ].join(" ");

  return (
    <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2">
      <button
        type="button"
        onClick={fitAll}
        title="Fit all markers"
        aria-label="Fit all markers"
        className={control}
      >
        <Maximize className="h-[18px] w-[18px]" />
      </button>
      <button
        type="button"
        onClick={reset}
        title="Reset view"
        aria-label="Reset view"
        className={control}
      >
        <Crosshair className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}

async function fetchOsrmGeometry(
  stops: DeliveryPoint[],
): Promise<LatLngTuple[]> {
  if (stops.length < 2) {
    return stops.map((stop) => [stop.latitude, stop.longitude]);
  }

  const coords = stops
    .map((stop) => `${stop.longitude},${stop.latitude}`)
    .join(";");
  const url = `${OSRM_BASE_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false&alternatives=false`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OSRM request failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    routes?: { geometry?: { coordinates?: [number, number][] } }[];
  };

  const coordinates = data.routes?.[0]?.geometry?.coordinates;
  if (!coordinates || coordinates.length === 0) {
    return stops.map((stop) => [stop.latitude, stop.longitude]);
  }

  return coordinates.map(([lng, lat]) => [lat, lng]);
}

export default function MapView({
  points,
  startPointId,
  endPointId,
  result,
  selectedRouteId,
  onSelectRoute,
}: MapViewProps) {
  const pointById = useMemo(
    () => new Map(points.map((p) => [p.id, p])),
    [points],
  );
  const [routeGeometries, setRouteGeometries] = useState<
    Record<string, LatLngTuple[]>
  >({});

  const routeSignatures = useMemo(
    () =>
      result?.routes.map((route) => ({
        vehicleId: route.vehicleId,
        signature: route.stops
          .map((stop) => {
            const point = pointById.get(stop.pointId);
            return point
              ? `${point.latitude},${point.longitude}`
              : stop.pointId;
          })
          .join("|"),
      })) ?? [],
    [pointById, result?.routes],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadRoutes() {
      if (!result) {
        setRouteGeometries({});
        return;
      }

      const nextEntries = await Promise.all(
        result.routes.map(async (route) => {
          const stops = route.stops
            .map((stop) => pointById.get(stop.pointId))
            .filter((point): point is DeliveryPoint => Boolean(point));

          if (stops.length < 2) {
            return [route.vehicleId, [] as LatLngTuple[]] as const;
          }

          try {
            const geometry = await fetchOsrmGeometry(stops);
            return [route.vehicleId, geometry] as const;
          } catch {
            return [
              route.vehicleId,
              stops.map(
                (stop) => [stop.latitude, stop.longitude] as LatLngTuple,
              ),
            ] as const;
          }
        }),
      );

      if (!cancelled) {
        setRouteGeometries(Object.fromEntries(nextEntries));
      }
    }

    void loadRoutes();

    return () => {
      cancelled = true;
    };
  }, [pointById, result, routeSignatures]);

  function iconFor(p: DeliveryPoint, index: number) {
    if (p.id === startPointId && p.id === endPointId) return depotIcon();
    if (p.id === startPointId) return startIcon();
    if (p.id === endPointId) return endIcon();
    return deliveryIcon(String(index + 1));
  }

  return (
    <MapContainer
      center={PARIS}
      zoom={12}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds points={points} />
      <MapControls points={points} />

      {/* Route polylines */}
      {result?.routes.map((route, idx) => {
        const color = routeColor(idx);
        const selected = selectedRouteId === route.vehicleId;
        const dimmed = selectedRouteId !== null && !selected;
        const latlngs = routeGeometries[route.vehicleId] ?? [];
        if (latlngs.length === 0) return null;
        return (
          <Polyline
            key={route.vehicleId}
            positions={latlngs}
            pathOptions={{
              color,
              weight: selected ? 6 : 4,
              opacity: dimmed ? 0.25 : 0.9,
            }}
            eventHandlers={{
              click: () => onSelectRoute(selected ? null : route.vehicleId),
            }}
          />
        );
      })}

      {/* Numbered stop markers for the selected route */}
      {result?.routes
        .filter(
          (r) => selectedRouteId === null || r.vehicleId === selectedRouteId,
        )
        .map((route, idx) => {
          const realIdx = result.routes.findIndex(
            (r) => r.vehicleId === route.vehicleId,
          );
          const color = routeColor(realIdx);
          return route.stops.map((stop) => {
            const p = pointById.get(stop.pointId);
            if (!p) return null;
            return (
              <Marker
                key={`${route.vehicleId}-${stop.sequence}`}
                position={[p.latitude, p.longitude]}
                icon={stopIcon(color, stop.sequence)}
              >
                <Popup>
                  <span className="text-[13px] font-semibold text-ink">
                    Vehicle {route.vehicleId} · stop {stop.sequence}
                  </span>
                  <br />
                  <span className="text-[13px] text-steel">{p.address}</span>
                </Popup>
              </Marker>
            );
          });
        })}

      {/* Base delivery markers (hidden once results exist to avoid clutter) */}
      {!result &&
        points.map((p, index) => (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={iconFor(p, index)}
          >
            <Popup>
              <span className="text-[13px] font-semibold text-ink">
                {p.address}
              </span>
              <br />
              <span className="text-[13px] text-steel">
                {formatCoords(p.latitude, p.longitude)}
              </span>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
