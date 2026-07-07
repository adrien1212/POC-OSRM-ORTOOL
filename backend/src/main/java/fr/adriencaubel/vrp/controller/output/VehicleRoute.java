package fr.adriencaubel.vrp.controller.output;

import java.util.List;

public record VehicleRoute(
        int vehicleId,
        List<RouteStop> stops,
        double totalDistanceMeters,
        double totalDurationSeconds,
        long totalLoadUnits
) {}
