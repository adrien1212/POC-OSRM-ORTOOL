package fr.adriencaubel.vrp.service.optimization;

public class DurationDimensionDecorator implements RoutingModelDecorator {

    private final long maxDurationSeconds;

    public DurationDimensionDecorator(long maxDurationSeconds) {
        this.maxDurationSeconds = maxDurationSeconds;
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
    }
}
