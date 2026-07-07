package fr.adriencaubel.vrp.controller.input;

public record OptimizeRouteStopRequest(
        String address,
        int demand
) {}
