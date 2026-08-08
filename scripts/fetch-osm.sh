#!/usr/bin/env bash
#
# Download the OpenStreetMap extract that OSRM routes on.
#
# Defaults to the Aveyron department (~64 MB), which covers Rodez and the sample
# data. For the wider Midi-Pyrénées region used in production (~390 MB):
#
#   OSM_REGION_URL=https://download.geofabrik.de/europe/france/midi-pyrenees-latest.osm.pbf \
#   OSM_FILE=midi-pyrenees-latest.osm.pbf ./scripts/fetch-osm.sh
#
# Any .osm.pbf extract works. Two good sources:
#   - https://download.openstreetmap.fr/extracts/  (splits France by department)
#   - https://download.geofabrik.de/               (countries and large regions)
# Keep OSM_FILE in sync with the filename you want locally, and set the same
# value in your .env so docker compose picks up the right file.
#
set -euo pipefail

OSM_REGION_URL="${OSM_REGION_URL:-https://download.openstreetmap.fr/extracts/europe/france/midi_pyrenees/aveyron.osm.pbf}"
OSM_FILE="${OSM_FILE:-aveyron.osm.pbf}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="${REPO_ROOT}/data"
TARGET="${DATA_DIR}/${OSM_FILE}"

if ! command -v curl >/dev/null 2>&1; then
  echo "error: curl is required but not installed." >&2
  exit 1
fi

if [ -f "${TARGET}" ]; then
  echo "Already present: ${TARGET}"
  echo "Delete it and re-run if you want a fresh download."
  exit 0
fi

mkdir -p "${DATA_DIR}"

echo "Downloading ${OSM_REGION_URL}"
echo "         -> ${TARGET}"

# Download to a temp file so an interrupted run never leaves a truncated extract
# that OSRM would later fail on with a confusing parse error.
TMP="${TARGET}.part"
trap 'rm -f "${TMP}"' EXIT
curl -fL --progress-bar -o "${TMP}" "${OSM_REGION_URL}"

# Mirrors like Geofabrik redirect unknown paths to their homepage with a 200, so
# a "successful" download can silently be an HTML page. Every PBF starts with a
# header block naming OSMHeader — check for it rather than trusting the status.
if ! head -c 128 "${TMP}" | grep -qa "OSMHeader"; then
  echo >&2
  echo "error: ${OSM_REGION_URL} did not return an OpenStreetMap PBF file." >&2
  echo "       (got $(wc -c <"${TMP}" | tr -d ' ') bytes that are not a .osm.pbf)" >&2
  echo "       Check the URL exists — mirrors redirect unknown paths to their homepage." >&2
  exit 1
fi

mv "${TMP}" "${TARGET}"
trap - EXIT

echo
echo "Done ($(du -h "${TARGET}" | cut -f1)). Next:"
if [ "${OSM_FILE}" != "aveyron.osm.pbf" ]; then
  echo "  echo 'OSM_FILE=${OSM_FILE}' >> .env"
fi
echo "  docker compose up"
echo
echo "The first start is slow: OSRM builds its routing graph into a Docker volume."
echo
echo "OpenStreetMap data is © OpenStreetMap contributors, licensed under the ODbL."
