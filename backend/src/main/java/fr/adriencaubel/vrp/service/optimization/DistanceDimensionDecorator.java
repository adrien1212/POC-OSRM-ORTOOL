package fr.adriencaubel.vrp.service.optimization;

import com.google.ortools.constraintsolver.RoutingDimension;

public class DistanceDimensionDecorator implements RoutingModelDecorator {

    private final long maxDistanceMeters;
    private final int globalSpanCostCoefficient;

    public DistanceDimensionDecorator(long maxDistanceMeters, int globalSpanCostCoefficient) {
        this.maxDistanceMeters = maxDistanceMeters;
        this.globalSpanCostCoefficient = globalSpanCostCoefficient;
    }

    @Override
    public void decorate(RouteOptimizationContext context) {
        context.routing().addDimension(
                context.transitCallbackIndex(),
                0,
                maxDistanceMeters,
                true,
                "Distance"
        );

        RoutingDimension distanceDimension = context.routing().getDimensionOrDie("Distance");
        distanceDimension.setGlobalSpanCostCoefficient(globalSpanCostCoefficient);
    }
}
