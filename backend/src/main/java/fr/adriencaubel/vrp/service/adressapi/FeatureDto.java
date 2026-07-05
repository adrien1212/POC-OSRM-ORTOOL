package fr.adriencaubel.vrp.service.adressapi;

public record FeatureDto(
        String type,
        GeometryDto geometry,
        PropertiesDto properties
) {}
