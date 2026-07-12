package fr.adriencaubel.vrp.service.optimization;

import com.google.ortools.constraintsolver.RoutingDimension;

public class DurationDimensionDecorator implements RoutingModelDecorator {

    private final long maxDurationSeconds;
    private final int globalSpanCostCoefficient;

    public DurationDimensionDecorator(long maxDurationSeconds, int globalSpanCostCoefficient) {
        this.maxDurationSeconds = maxDurationSeconds;
        this.globalSpanCostCoefficient = globalSpanCostCoefficient;
    }

    @Override
    public void decorate(RouteOptimizationContext context) {
        context.routing().addDimension(
                context.durationCallbackIndex(),
                0,
                maxDurationSeconds,
                true,
                "Duration"
        );

        RoutingDimension durationDimension = context.routing().getDimensionOrDie("Duration");
        if (globalSpanCostCoefficient > 0) {
            durationDimension.setGlobalSpanCostCoefficient(globalSpanCostCoefficient);
        }
    }
}
