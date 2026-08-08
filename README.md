# Cartographie — a vehicle routing planner

Place delivery points on a map, set your fleet, and get optimized tours on real roads.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![CI](https://github.com/adrien1212/POC-OSRM-ORTOOL/actions/workflows/ci.yml/badge.svg)](https://github.com/adrien1212/POC-OSRM-ORTOOL/actions/workflows/ci.yml)

### ▶ [Try the live demo](https://carto.traino.tech) — no install required

A solver for the **Vehicle Routing Problem**: given a depot, a set of stops and a fleet of vehicles,
it decides who visits what and in which order. Distances and durations come from real road routing
(OSRM on OpenStreetMap data), not straight lines, and the optimization runs on Google OR-Tools.

Originally built for the Aveyron / Midi-Pyrénées region in France, but it works anywhere you have an
OpenStreetMap extract.

## Features

- **Map-first planning** — click to place the depot and delivery points on a Leaflet map.
- **Address search** — geocoding through the French government address API.
- **Real road routing** — distance and duration matrices and route geometries from a local OSRM server.
- **Constraints you can tune** — number of vehicles, per-vehicle capacity, maximum distance, maximum
  duration, per-stop service time, and whether every vehicle must be used.
- **Optimize for distance or duration**, with a configurable solver time budget.
- **Self-hostable** — three containers and one `docker compose up`.

## Quickstart

You need **Docker** (with Compose) and about 2 GB of free disk.

```bash
git clone https://github.com/adrien1212/POC-OSRM-ORTOOL.git
cd POC-OSRM-ORTOOL
./scripts/fetch-osm.sh     # downloads the Aveyron OSM extract (~64 MB) into data/
docker compose up
```

Then open **http://localhost:8013**.

The **first start takes several minutes**: OSRM has to extract, partition and customize the routing
graph before it will answer. It caches the result in a Docker volume, so later starts are quick.

| Service | URL |
| --- | --- |
| Frontend | http://localhost:8013 |
| Backend API | http://localhost:8012 |
| OSRM | http://localhost:5001 |

### A different region

The default extract covers the Aveyron department, which is enough to try the app. For anywhere else,
point the script at another extract — [openstreetmap.fr](https://download.openstreetmap.fr/extracts/)
splits France by department, [Geofabrik](https://download.geofabrik.de/) covers countries and larger
regions:

```bash
OSM_REGION_URL=https://download.geofabrik.de/europe/france/midi-pyrenees-latest.osm.pbf \
OSM_FILE=midi-pyrenees-latest.osm.pbf ./scripts/fetch-osm.sh

echo 'OSM_FILE=midi-pyrenees-latest.osm.pbf' >> .env
docker compose up
```

Bigger extracts take proportionally longer to build and need more RAM. See [`.env.example`](./.env.example)
for every knob.

## Architecture

```
frontend (React + Leaflet)          backend (Spring Boot + OR-Tools)         OSRM
  place points on a map  ──POST──►  /api/v1/routes/optimize
                                      │  geocode addresses  ───────────────► address API
                                      │  distance/duration matrix ─────────► /table
                                      │  solve with OR-Tools
                                      │  fetch route geometries ───────────► /route
  draw routes on the map  ◄─────────  vehicle routes
```

- **`backend/`** — Java 25 / Spring Boot 4.1 (Maven), port 8012. `RouteOptimizationService`
  orchestrates: fetch the OSRM matrix, build the OR-Tools model, solve, map to the response.
- **`frontend/`** — React 19 / TanStack Start / Vite / Tailwind / shadcn-ui / Leaflet, built with
  **bun**. State lives in `hooks/usePlannerStore.tsx`.
- **OSRM** — the routing engine, run as a container from an OpenStreetMap extract.
- **`prototype/`** — the original Python/OR-Tools/Folium notebook, [kept for reference](./prototype/README.md).

### Adding a routing constraint

The OR-Tools model is assembled with a **decorator pattern** in
`backend/src/main/java/fr/adriencaubel/vrp/service/optimization/`. Each `RoutingModelDecorator` layers
one constraint or dimension onto the routing model — `DistanceDimensionDecorator`,
`DurationDimensionDecorator`, `CapacityDimensionDecorator`, `ForceVehicleUsageDecorator`.

To add a constraint (time windows, pickup-and-delivery, skills), **write a new decorator** rather than
editing the solver inline.

## API

```http
POST /api/v1/routes/optimize
Content-Type: application/json
```

```json
{
  "depot": "Rodez",
  "stops": [
    { "address": "Flavin", "quantity": 3, "stopType": "DELIVERY", "serviceDurationMinutes": 10 },
    { "address": "Baraqueville", "quantity": 5, "stopType": "DELIVERY", "serviceDurationMinutes": 10 }
  ],
  "vehicleCount": 2,
  "vehicleCapacities": [10, 10],
  "isUseAllVehicule": false,
  "objective": "DISTANCE",
  "maximumDistance": 200000,
  "maximumDuration": 28800,
  "computationTime": 5
}
```

```json
{
  "vehicles": [
    {
      "vehicleId": 0,
      "stops": [
        { "address": "Rodez", "latitude": 44.359272, "longitude": 2.566732, "serviceDurationMinutes": 0 },
        { "address": "Flavin", "latitude": 44.289807, "longitude": 2.626077, "serviceDurationMinutes": 10 },
        { "address": "Baraqueville", "latitude": 44.277646, "longitude": 2.449022, "serviceDurationMinutes": 10 },
        { "address": "Rodez", "latitude": 44.359272, "longitude": 2.566732, "serviceDurationMinutes": 0 }
      ],
      "totalDistanceMeters": 44559.0,
      "totalDurationSeconds": 4226.0,
      "totalLoadUnits": 8
    }
  ]
}
```

Addresses are geocoded server-side. `objective` is `DISTANCE` or `DURATION`; `maximumDistance` is in
metres, `maximumDuration` in seconds, `computationTime` is the solver budget in seconds.

`GET /api/v1/coordonnees` and `/api/v1/coordonnees/matrix` expose coordinates and the raw OSRM
distance/duration matrices.

## Development

Run each service natively against the others. Start OSRM first — everything needs it:

```bash
./scripts/fetch-osm.sh
docker compose up osrm
```

## Contributing

Feel free.

## License

[MIT](./LICENSE).

## Acknowledgements

- [Google OR-Tools](https://developers.google.com/optimization) — the solver (Apache-2.0)
- [Project OSRM](https://project-osrm.org/) — road routing (BSD-2-Clause)
- **Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors**, available
  under the [Open Database License](https://opendatacommons.org/licenses/odbl/) — extracts courtesy of
  [openstreetmap.fr](https://download.openstreetmap.fr/) and [Geofabrik](https://download.geofabrik.de/)
- [Leaflet](https://leafletjs.com/) — the map (BSD-2-Clause)
- [api-adresse.data.gouv.fr](https://adresse.data.gouv.fr/) — French address geocoding
