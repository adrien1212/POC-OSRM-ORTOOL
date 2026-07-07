package fr.adriencaubel.vrp.service.optimization;

public class ForceVehicleUsageDecorator implements RoutingModelDecorator {

    @Override
    public void decorate(RouteOptimizationContext context) {
        for (int vehicleId = 0; vehicleId < context.vehicleCount(); vehicleId++) {
            long start = context.routing().start(vehicleId);
            long end = context.routing().end(vehicleId);

            context.routing().solver().addConstraint(
                    context.routing().solver().makeNonEquality(
                            context.routing().nextVar(start),
                            end
                    )
            );
        }
    }
}
