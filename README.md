# Cartographie — a vehicle routing planner

Place delivery points on a map, set your fleet, and get optimized tours on real roads.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![CI](git clone https://github.com/adrien1212/vehicle-routing-planner
/actions/workflows/ci.yml/badge.svg)](https://github.com/adrien1212/POC-OSRM-ORTOOL/actions/workflows/ci.yml)

### ▶ [Try the live demo](https://carto.traino.tech)

A solver for the **Vehicle Routing Problem**: given a depot, a set of stops and a fleet of vehicles,
it decides who visits what and in which order. Distances and durations come from real road routing
(OSRM on OpenStreetMap data), not straight lines, and the optimization runs on Google OR-Tools.

Originally built for the Midi-Pyrénées region in France, but it works anywhere you have an
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
git clone https://github.com/adrien1212/vehicle-routing-planner
cd vehicle-routing-planner
./scripts/fetch-osm.sh     # downloads the Midi-Pyrénées OSM extract (~390 MB) into data/
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

The default extract covers the whole Midi-Pyrénées region. For anywhere else — or for a smaller,
faster download — point the script at another extract:
[openstreetmap.fr](https://download.openstreetmap.fr/extracts/) splits France by department,
[Geofabrik](https://download.geofabrik.de/) covers countries and larger regions:

```bash
OSM_REGION_URL=https://download.openstreetmap.fr/extracts/europe/france/midi_pyrenees/aveyron.osm.pbf \
OSM_FILE=aveyron.osm.pbf ./scripts/fetch-osm.sh

echo 'OSM_FILE=aveyron.osm.pbf' >> .env
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
- **OSRM** — the routing engine, run as a container from an OpenStreetMap extract. Give the Distance/duration matrix
- **OR-Tools** - the Vehicle Routing Solver with constraint. It assigns stops to vehicles and orders them
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

### Request
```json
{
  "depot": "1 rue du Terral, 12000 Rodez",
  "stops": [
   {
      "address": "32 avenue de la Gineste, 12000 Rodez",
      "quantity": 4,
      "serviceDurationMinutes": 20
   },
   {
      "address": "16 rue Jean XXIII, 12000 Rodez",
      "quantity": 4,
      "serviceDurationMinutes": 10
   },   
   {
      "address": "60 Avenue de Fontanille 12000 Rodez",
      "quantity": 4,
      "stopType": "pickup",
      "serviceDurationMinutes": 20
   }
  ],
  "isUseAllVehicule": true,
  "objective": "distance",
  "vehicleCount": 2,
  "vehicleCapacities": [10, 12],
  "maximumDistance": 2000,
  "maximumDuration": 20,
  "computationTime": 5
}
```

### Response

```json
{
  "vehicles": [
    {
      "vehicleId": 0,
      "stops": [
        {
          "address": "1 rue du Terral, 12000 Rodez",
          "latitude": 44.350793,
          "longitude": 2.574211,
          "serviceDurationMinutes": 0
        },
        {
          "address": "32 avenue de la Gineste, 12000 Rodez",
          "latitude": 44.362338,
          "longitude": 2.564982,
          "serviceDurationMinutes": 20
        },
        {
          "address": "60 Avenue de Fontanille 12000 Rodez",
          "latitude": 44.362654,
          "longitude": 2.553232,
          "serviceDurationMinutes": 20
        },
        {
          "address": "1 rue du Terral, 12000 Rodez",
          "latitude": 44.350793,
          "longitude": 2.574211,
          "serviceDurationMinutes": 0
        }
      ],
      "totalDistanceMeters": 6442.0,
      "totalDurationSeconds": 3400.0,
      "totalLoadUnits": 4
    },
    {
      "vehicleId": 1,
      "stops": [
        {
          "address": "1 rue du Terral, 12000 Rodez",
          "latitude": 44.350793,
          "longitude": 2.574211,
          "serviceDurationMinutes": 0
        },
        {
          "address": "16 rue Jean XXIII, 12000 Rodez",
          "latitude": 44.359247,
          "longitude": 2.583068,
          "serviceDurationMinutes": 10
        },
        {
          "address": "1 rue du Terral, 12000 Rodez",
          "latitude": 44.350793,
          "longitude": 2.574211,
          "serviceDurationMinutes": 0
        }
      ],
      "totalDistanceMeters": 3733.0,
      "totalDurationSeconds": 1249.0,
      "totalLoadUnits": 4
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
