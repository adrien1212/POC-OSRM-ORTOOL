package fr.adriencaubel.vrp.controller.input;

/**
 * A single point to visit in an {@link OptimizeRouteRequest}.
 *
 * @param address                free-form address of the stop; geocoded through the French
 *                               government address API. Required.
 * @param quantity               load handled at this stop, in the same unit as
 *                               {@link OptimizeRouteRequest#vehicleCapacities()}. Optional —
 *                               {@code null} is treated as {@code 0}; must be greater than or
 *                               equal to zero. The sign is derived from {@code stopType}.
 * @param stopType               {@code "pickup"} (case-insensitive) means the quantity is loaded
 *                               onto the vehicle; any other value, including {@code null}, is
 *                               treated as a delivery and unloads the quantity.
 * @param serviceDurationMinutes time spent on site, in <b>minutes</b>; added to the route
 *                               duration on top of the travel time.
 */
public record OptimizeRouteStopRequest(
        String address,
        Integer quantity,
        String stopType,
        int serviceDurationMinutes
) {}
