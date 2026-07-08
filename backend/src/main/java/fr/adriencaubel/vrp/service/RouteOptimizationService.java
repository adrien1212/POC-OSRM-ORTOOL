package fr.adriencaubel.vrp.service;

import com.google.ortools.Loader;
import com.google.ortools.constraintsolver.*;
import com.google.protobuf.Duration;
import fr.adriencaubel.vrp.controller.input.OptimizeRouteRequest;
import fr.adriencaubel.vrp.controller.input.OptimizeRouteStopRequest;
import fr.adriencaubel.vrp.controller.output.OptimizeRouteResponse;
import fr.adriencaubel.vrp.controller.output.RouteStop;
import fr.adriencaubel.vrp.controller.output.VehicleRoute;
import fr.adriencaubel.vrp.service.adressapi.FeatureCollectionDto;
import fr.adriencaubel.vrp.service.osrmapi.OSRMDTO;
import fr.adriencaubel.vrp.service.optimization.CapacityDimensionDecorator;
import fr.adriencaubel.vrp.service.optimization.DistanceDimensionDecorator;
import fr.adriencaubel.vrp.service.optimization.DurationDimensionDecorator;
import fr.adriencaubel.vrp.service.optimization.ForceVehicleUsageDecorator;
import fr.adriencaubel.vrp.service.optimization.RouteOptimizationContext;
import fr.adriencaubel.vrp.service.optimization.RoutingModelDecorator;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RouteOptimizationService {

    public static final Logger logger = LoggerFactory.getLogger(RouteOptimizationService.class);

    private static final String OSRM_BASE_URL = System.getenv().getOrDefault("OSRM_BASE_URL", "http://127.0.0.1:5001");

    public OptimizeRouteResponse optimize(OptimizeRouteRequest request) {
        if (request.stops() == null || request.stops().isEmpty()) {
            throw new IllegalArgumentException("At least one address is required");
        }

        if (request.vehicleCount() <= 0) {
            throw new IllegalArgumentException("Vehicle count must be greater than zero");
        }

        if (request.stops().stream().anyMatch(stop -> stop.quantity() != null && stop.quantity() < 0)) {
            throw new IllegalArgumentException("Quantity must be greater than or equal to zero");
        }

        long[] vehicleCapacities = resolveVehicleCapacities(request);
        if (vehicleCapacities != null && Arrays.stream(vehicleCapacities).anyMatch(capacity -> capacity <= 0)) {
            throw new IllegalArgumentException("Each vehicle capacity must be greater than zero");
        }

        List<Coordonees> coordonees = new ArrayList<>();
        List<RouteStop> stops = new ArrayList<>();
        List<Long> demands = new ArrayList<>();
        List<Long> serviceDurations = new ArrayList<>();

        Coordonees depotCoordonnees = adresseToCoordonne(request.depot());
        coordonees.add(depotCoordonnees);
        stops.add(new RouteStop(
                request.depot(),
                depotCoordonnees.latitude(),
                depotCoordonnees.longitude()
        ));
        demands.add(0L);
        serviceDurations.add(0L); // depot

        for(OptimizeRouteStopRequest stopRequest : request.stops()) {
            Coordonees stopCoordonnees = adresseToCoordonne(stopRequest.address());
            coordonees.add(stopCoordonnees);
            stops.add(new RouteStop(
                    stopRequest.address(),
                    stopCoordonnees.latitude(),
                    stopCoordonnees.longitude()
            ));
            demands.add(resolveSignedDemand(stopRequest));

            serviceDurations.add(
                    stopRequest.serviceDurationMinutes() * 60L
            );
        }

        OSRMDTO osrmdto = distanceMatrix(coordonees);

        return solveVRP(
                request.vehicleCount(),
                vehicleCapacities,
                0,
                osrmdto.distances(),
                osrmdto.durations(),
                demands,
                serviceDurations,
                stops,
                request.isUseAllVehicule(),
                request.maximumDistance(),
                request.maximumDuration(),
                request.computationTime()
        );
    }

    public OptimizeRouteResponse solveVRP(
            int vehicleCount,
            long[] vehicleCapacities,
            int depotIndex,
            long[][] distanceMatrix,
            long[][] durationMatrix,
            List<Long> demands,
            List<Long> serviceDurations,
            List<RouteStop> stops,
            boolean isUseAllVehicule,
            int maximumDistance,
            int maximumDuration,
            int computationTime
    ) {

        RoutingIndexManager manager = new RoutingIndexManager(
                distanceMatrix.length,
                vehicleCount,
                depotIndex
        );

        RoutingModel routing = new RoutingModel(manager);

        int transitCallbackIndex = routing.registerTransitCallback((fromIndex, toIndex) -> {
            int fromNode = manager.indexToNode(fromIndex);
            int toNode = manager.indexToNode(toIndex);

            long distance = distanceMatrix[fromNode][toNode];

            logger.info("fromIndex={}, toIndex={}, fromNode={}, toNode={}, distance={}",
                    fromIndex, toIndex, fromNode, toNode, distance);

            return distanceMatrix[fromNode][toNode];
        });


        int durationCallbackIndex = routing.registerTransitCallback((fromIndex, toIndex) -> {
            int fromNode = manager.indexToNode(fromIndex);
            int toNode = manager.indexToNode(toIndex);

            return durationMatrix[fromNode][toNode] + serviceDurations.get(fromNode);
        });

        int demandCallbackIndex = routing.registerUnaryTransitCallback(fromIndex ->
                demands.get(manager.indexToNode(fromIndex))
        );

        routing.setArcCostEvaluatorOfAllVehicles(transitCallbackIndex);

        RouteOptimizationContext context = new RouteOptimizationContext(
                manager,
                routing,
                transitCallbackIndex,
                durationCallbackIndex,
                demandCallbackIndex,
                distanceMatrix,
                durationMatrix,
                demands,
                stops,
                vehicleCount,
                vehicleCapacities,
                isUseAllVehicule
        );

        List<RoutingModelDecorator> decorators = new ArrayList<>(List.of(
                new DistanceDimensionDecorator(maximumDistance * 1000L, 100),
                new DurationDimensionDecorator(maximumDuration * 3600L),
                new CapacityDimensionDecorator()
        ));
        if (isUseAllVehicule) {
            decorators.add(new ForceVehicleUsageDecorator());
        }

        for (RoutingModelDecorator decorator : decorators) {
            decorator.decorate(context);
        }

        RoutingSearchParameters searchParameters =
                main.defaultRoutingSearchParameters()
                        .toBuilder()
                        .setFirstSolutionStrategy(FirstSolutionStrategy.Value.PATH_CHEAPEST_ARC)
                        .setLocalSearchMetaheuristic(LocalSearchMetaheuristic.Value.GUIDED_LOCAL_SEARCH)
                        .setTimeLimit(Duration.newBuilder().setSeconds(computationTime).build())
                        .build();

        Assignment solution = routing.solveWithParameters(searchParameters);

        if(solution == null) {
            throw new IllegalArgumentException("no solution found");
        }

        return printSolution(routing, manager, solution, vehicleCount, stops, vehicleCapacities != null);
    }

    private long[] resolveVehicleCapacities(OptimizeRouteRequest request) {
        List<Integer> capacities = request.vehicleCapacities();
        if (capacities == null || capacities.isEmpty()) {
            return null;
        }
        if (capacities.size() != request.vehicleCount()) {
            throw new IllegalArgumentException("You must specify capacity for each vehicle");
        }

        long[] resolved = new long[request.vehicleCount()];
        for (int i = 0; i < resolved.length; i++) {
            resolved[i] = capacities.get(i);
        }
        return resolved;
    }

    private long resolveSignedDemand(OptimizeRouteStopRequest stopRequest) {
        long quantity = stopRequest.quantity() == null ? 0L : stopRequest.quantity().longValue();
        if (quantity == 0L) {
            return 0L;
        }
        boolean pickup = stopRequest.stopType() != null
                && stopRequest.stopType().equalsIgnoreCase("pickup");
        return pickup ? quantity : -quantity;
    }

    static OptimizeRouteResponse printSolution(
            RoutingModel routing,
            RoutingIndexManager manager,
            Assignment solution,
            int vehicleCount,
            List<RouteStop> stops,
            boolean hasCapacityDimension
    ) {
        logger.info("Objective: " + solution.objectiveValue());

        long totalDistance = 0;
        RoutingDimension durationDimension = routing.getDimensionOrDie("Duration");
        RoutingDimension capacityDimension = hasCapacityDimension
                ? routing.getDimensionOrDie("Capacity")
                : null;
        List<VehicleRoute> vehicleRoutes = new ArrayList<>();

        for (int vehicleId = 0; vehicleId < vehicleCount; vehicleId++) {
            long index = routing.start(vehicleId);
            long routeDistance = 0;
            long routeDuration = 0;
            long routeLoad = 0;
            long routePeakLoad = 0;
            StringBuilder route = new StringBuilder();
            List<RouteStop> vehicleStops = new ArrayList<>();

            route.append("Vehicle ").append(vehicleId).append(": ");

            if (capacityDimension != null) {
                routePeakLoad = solution.value(capacityDimension.cumulVar(index));
            }

            while (!routing.isEnd(index)) {
                int nodeIndex = manager.indexToNode(index);
                route.append(nodeIndex).append(" -> ");
                vehicleStops.add(stops.get(nodeIndex));

                long previousIndex = index;
                index = solution.value(routing.nextVar(index));

                routeDistance += routing.getArcCostForVehicle(
                        previousIndex,
                        index,
                        vehicleId
                );

                routeDuration = solution.value(durationDimension.cumulVar(index));
                if (capacityDimension != null) {
                    routePeakLoad = Math.max(routePeakLoad, solution.value(capacityDimension.cumulVar(index)));
                }
            }

            int endNodeIndex = manager.indexToNode(index);
            route.append(endNodeIndex);
            vehicleStops.add(stops.get(endNodeIndex));
            if (capacityDimension != null) {
                routePeakLoad = Math.max(routePeakLoad, solution.value(capacityDimension.cumulVar(index)));
                routeLoad = routePeakLoad;
            }

            logger.info(route.toString());
            logger.info("Route distance: " + routeDistance);
            logger.info("Route duration: " + routeDuration);
            logger.info("Route peak load: " + routeLoad);

            totalDistance += routeDistance;
            vehicleRoutes.add(new VehicleRoute(vehicleId, vehicleStops, routeDistance, routeDuration, routeLoad));
        }

        logger.info("Total distance: " + totalDistance);

        return new OptimizeRouteResponse(vehicleRoutes);
    }

    public static Coordonees adresseToCoordonne(String adresse) {
        RestClient restClient = RestClient.builder()
                .baseUrl("https://data.geopf.fr/geocodage/search")
                .build();

        ResponseEntity<FeatureCollectionDto> response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .queryParam("q", adresse)

                        .build())
                .header("Content-Type", "application/json")
                .retrieve()

                .toEntity(FeatureCollectionDto.class);

        if(!response.hasBody()) {
            throw new IllegalArgumentException("No adress found");
        }

        List<Double> coordonees = response.getBody().features().get(0).geometry().coordinates();
        // latitude first
        return new Coordonees(coordonees.get(1), coordonees.get(0), adresse);
    }

    public static OSRMDTO distanceMatrix(List<Coordonees> coordonees) {
        // osrm is longitude first
        String cString = coordonees.stream().map(c -> c.longitude() + "," + c.latitude()).collect(Collectors.joining(";"));

        RestClient restClient = RestClient.builder()
                .baseUrl(OSRM_BASE_URL)
                .build();

        ResponseEntity<OSRMDTO> response = restClient.get()
                .uri("/table/v1/driving/" + cString + "?annotations=distance,duration")
                .header("Content-Type", "application/json")
                .retrieve()
                .toEntity(OSRMDTO.class);

        return response.getBody();
    }
}
