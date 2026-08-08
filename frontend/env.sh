#!/bin/sh
# Runtime env substitution for the static nginx build.
#
# The production build bakes the literal strings VITE_API_BASE_URL and
# VITE_OSRM_BASE_URL into the bundle; this replaces them with the container's
# actual env values on startup, so one image works on any host.
#
# Every variable must be prefixed VITE_.
set -eu

for i in $(env | grep '^VITE_'); do
    key=$(echo "$i" | cut -d '=' -f 1)
    value=$(echo "$i" | cut -d '=' -f 2-)
    echo "$key=$value"
    find /usr/share/nginx/html -type f \( -name '*.js' -o -name '*.css' \) \
        -exec sed -i "s|${key}|${value}|g" '{}' +
done
