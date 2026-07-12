package fr.adriencaubel.vrp.controller.output;

public record RouteStop( String address, double latitude, double longitude, int serviceDurationMinutes ) {}
