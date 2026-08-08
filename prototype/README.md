# Python prototype (reference only)

`carto.ipynb` is the original Jupyter notebook this project grew out of. It solves the same vehicle
routing problem with OR-Tools, queries OSRM directly for the distance/duration matrices, and renders
the result as a Folium map written to `vrp_routes.html`.

**It is superseded by the Spring Boot backend and is kept for reference.** New work belongs in
`backend/`. The notebook is not covered by CI and may drift.

## Running it

Start OSRM (from the repo root):

```bash
./scripts/fetch-osm.sh
docker compose up osrm      # http://127.0.0.1:5001
```

Then:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install requests ortools folium jupyter
jupyter notebook prototype/carto.ipynb
```

Edit the `locations` list to change the depot and the points to visit, and `vehicle_count` in
`solve_vrp()` to change the fleet size. Running all cells prints the tours and writes `vrp_routes.html`.
