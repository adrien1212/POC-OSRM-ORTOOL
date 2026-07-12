package fr.adriencaubel.vrp.controller.input;

import java.util.List;

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
