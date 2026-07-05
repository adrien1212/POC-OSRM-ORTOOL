package fr.adriencaubel.vrp.service.adressapi;

import java.util.List;

public record GeometryDto(
        String type,
        List<Double> coordinates
) {}
