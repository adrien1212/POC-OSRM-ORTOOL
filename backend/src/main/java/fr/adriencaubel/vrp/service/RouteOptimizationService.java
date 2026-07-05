package fr.adriencaubel.vrp.service;

import com.google.ortools.Loader;
import com.google.ortools.constraintsolver.*;
import com.google.protobuf.Duration;
import fr.adriencaubel.vrp.controller.input.OptimizeRouteRequest;
import fr.adriencaubel.vrp.controller.output.OptimizeRouteResponse;
import fr.adriencaubel.vrp.controller.output.RouteStop;
import fr.adriencaubel.vrp.controller.output.VehicleRoute;
import fr.adriencaubel.vrp.service.adressapi.FeatureCollectionDto;
import fr.adriencaubel.vrp.service.osrmapi.OSRMDTO;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RouteOptimizationService {

    public static final Logger logger = LoggerFactory.getLogger(RouteOptimizationService.class);

    private static final String OSRM_BASE_URL = System.getenv().getOrDefault("OSRM_BASE_URL", "http://127.0.0.1:5001");

    public OptimizeRouteResponse optimize(OptimizeRouteRequest request) {
        if (request.addresses() == null || request.addresses().isEmpty()) {
            throw new IllegalArgumentException("At least one address is required");
        }

        if (request.vehicleCount() <= 0) {
            throw new IllegalArgumentException("Vehicle count must be greater than zero");
        }

        List<Coordonees> coordonees = new ArrayList<>();
        List<RouteStop> stops = new ArrayList<>();

        Coordonees depotCoordonnees = adresseToCoordonne(request.depot());
        coordonees.add(depotCoordonnees);
        stops.add(new RouteStop(
                request.depot(),
                depotCoordonnees.latitude(),
                depotCoordonnees.longitude()
        ));

        for(String adresse : request.addresses()) {
            Coordonees stopCoordonnees = adresseToCoordonne(adresse);
            coordonees.add(stopCoordonnees);
            stops.add(new RouteStop(
                    adresse,
                    stopCoordonnees.latitude(),
                    stopCoordonnees.longitude()
            ));
        }

        OSRMDTO osrmdto = distanceMatrix(coordonees);

        return solveVRP(request.vehicleCount(), 0, osrmdto.distances(), osrmdto.durations(), stops);
    }

    public OptimizeRouteResponse solveVRP(
            int vehicleCount,
            int depotIndex,
            long[][] distanceMatrix,
            long[][] durationMatrix,
            List<RouteStop> stops
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

            return durationMatrix[fromNode][toNode];
        });

        routing.setArcCostEvaluatorOfAllVehicles(transitCallbackIndex);

        routing.addDimension(
                transitCallbackIndex,
                0,
                2000000,  // max distance per vehicle in meters
                true,
                "Distance"
                );

        RoutingDimension distanceDimension = routing.getDimensionOrDie("Distance");
        distanceDimension.setGlobalSpanCostCoefficient(100);

        routing.addDimension(
                durationCallbackIndex,
                0,
                5 * 3600,  // max 8 hours per vehicle
                true,
                "Duration"
                );

        RoutingDimension durationDimension = routing.getDimensionOrDie("Duration");

        // force all vegicule
        for (int vehicleId = 0; vehicleId < vehicleCount; vehicleId++) {
            long start = routing.start(vehicleId);
            long end = routing.end(vehicleId);

            routing.solver().addConstraint(
                    routing.solver().makeNonEquality(
                            routing.nextVar(start),
                            end
                    )
            );
        }

        RoutingSearchParameters searchParameters =
                main.defaultRoutingSearchParameters()
                        .toBuilder()
                        .setFirstSolutionStrategy(FirstSolutionStrategy.Value.PATH_CHEAPEST_ARC)
                        .setLocalSearchMetaheuristic(LocalSearchMetaheuristic.Value.GUIDED_LOCAL_SEARCH)
                        .setTimeLimit(Duration.newBuilder().setSeconds(5).build())
                        .build();

        Assignment solution = routing.solveWithParameters(searchParameters);

        if(solution == null) {
            throw new IllegalArgumentException("no solution found");
        }

        return printSolution(routing, manager, solution, vehicleCount, stops);
    }

    static OptimizeRouteResponse printSolution(
            RoutingModel routing,
            RoutingIndexManager manager,
            Assignment solution,
            int vehicleCount,
            List<RouteStop> stops
    ) {
        logger.info("Objective: " + solution.objectiveValue());

        long totalDistance = 0;
        RoutingDimension durationDimension = routing.getDimensionOrDie("Duration");
        List<VehicleRoute> vehicleRoutes = new ArrayList<>();

        for (int vehicleId = 0; vehicleId < vehicleCount; vehicleId++) {
            long index = routing.start(vehicleId);
            long routeDistance = 0;
            long routeDuration = 0;
            StringBuilder route = new StringBuilder();
            List<RouteStop> vehicleStops = new ArrayList<>();

            route.append("Vehicle ").append(vehicleId).append(": ");

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
            }

            int endNodeIndex = manager.indexToNode(index);
            route.append(endNodeIndex);
            vehicleStops.add(stops.get(endNodeIndex));

            logger.info(route.toString());
            logger.info("Route distance: " + routeDistance);
            logger.info("Route duration: " + routeDuration);

            totalDistance += routeDistance;
            vehicleRoutes.add(new VehicleRoute(vehicleId, vehicleStops, routeDistance, routeDuration));
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
