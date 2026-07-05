package fr.adriencaubel.vrp.service.adressapi;

import java.util.List;

public record FeatureCollectionDto(
        String type,
        List<FeatureDto> features
) {}

