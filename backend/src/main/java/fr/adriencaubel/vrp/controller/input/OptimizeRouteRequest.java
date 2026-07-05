package fr.adriencaubel.vrp.controller.input;

import java.util.List;

public record OptimizeRouteRequest(
        String depot,
        List<String> addresses,
        int vehicleCount
) {}
