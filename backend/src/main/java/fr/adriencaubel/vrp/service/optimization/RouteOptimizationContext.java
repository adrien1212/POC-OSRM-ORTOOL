package fr.adriencaubel.vrp.service.optimization;

import com.google.ortools.constraintsolver.RoutingIndexManager;
import com.google.ortools.constraintsolver.RoutingModel;
import fr.adriencaubel.vrp.controller.output.RouteStop;

import java.util.List;

public record RouteOptimizationContext(
        RoutingIndexManager manager,
        RoutingModel routing,
        int transitCallbackIndex,
        int durationCallbackIndex,
        int demandCallbackIndex,
        long[][] distanceMatrix,
        long[][] durationMatrix,
        List<Long> demands,
        List<RouteStop> stops,
        int vehicleCount,
        long[] vehicleCapacities,
        boolean isUseAllVehicule
) {
    public boolean hasCapacityConstraints() {
        return vehicleCapacities != null && vehicleCapacities.length > 0;
    }
}
