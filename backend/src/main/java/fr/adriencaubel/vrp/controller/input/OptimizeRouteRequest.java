package fr.adriencaubel.vrp.controller.input;

import java.util.List;

/**
 * Request payload for {@code POST /api/v1/routes/optimize}.
 *
 * @param depot             free-form address used as the start and end point of every vehicle
 *                          route; geocoded through the French government address API. Required.
 * @param stops             the points to visit; must contain at least one entry.
 * @param vehicleCount      number of available vehicles; must be greater than zero.
 * @param vehicleCapacities optional capacity of each vehicle, expressed in the same unit as
 *                          {@link OptimizeRouteStopRequest#quantity()}. When {@code null} or
 *                          empty, no capacity constraint is applied; otherwise the list size must
 *                          equal {@code vehicleCount} and every value must be greater than zero.
 * @param isUseAllVehicule  when {@code true}, every vehicle must serve at least one stop (empty
 *                          routes are forbidden). Defaults to {@code false} when omitted.
 * @param objective         what the solver minimizes: {@code "distance"} /
 *                          {@code "minimize_distance"} or {@code "duration"} /
 *                          {@code "minimize_duration"} (case-insensitive). Defaults to distance
 *                          when {@code null} or blank; any other value is rejected.
 * @param maximumDistance   maximum distance allowed per vehicle route, in <b>kilometres</b>.
 *                          Must be provided: an omitted value falls back to {@code 0}, which
 *                          makes the problem unsolvable.
 * @param maximumDuration   maximum duration allowed per vehicle route, in <b>hours</b>, service
 *                          time included. Must be provided, same caveat as
 *                          {@code maximumDistance}.
 * @param computationTime   time limit given to the OR-Tools solver, in <b>seconds</b>. Must be
 *                          provided: an omitted value leaves the solver no time to search.
 */
public record OptimizeRouteRequest(
        String depot,
        List<OptimizeRouteStopRequest> stops,
        int vehicleCount,
        List<Integer> vehicleCapacities,
        boolean isUseAllVehicule,
        String objective,
        int maximumDistance,
        int maximumDuration,
        int computationTime
) {}
