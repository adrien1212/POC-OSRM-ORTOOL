package fr.adriencaubel.vrp.service.optimization;

public class CapacityDimensionDecorator implements RoutingModelDecorator {

    @Override
    public void decorate(RouteOptimizationContext context) {
        if (!context.hasCapacityConstraints()) {
            return;
        }

        context.routing().addDimensionWithVehicleCapacity(
                context.demandCallbackIndex(),
                0,
                context.vehicleCapacities(),
                true,
                "Capacity"
        );
    }
}
