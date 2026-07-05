package fr.adriencaubel.vrp.service.osrmapi;


import java.util.List;

/**
 * Matrix of distances in meters.
 * distances.get(i).get(j) = distance from point i to point j.
 */
public record OSRMDTO(long[][] distances, long[][] durations) {
}
