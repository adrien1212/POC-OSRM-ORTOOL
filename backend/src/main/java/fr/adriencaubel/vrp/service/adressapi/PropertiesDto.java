package fr.adriencaubel.vrp.service.adressapi;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PropertiesDto(
        String label,
        Double score,
        String id,
        String banId,
        String name,
        String postcode,
        String citycode,
        Double x,
        Double y,
        String city,
        String context,
        String type,
        Double importance,
        String depcode,
        String street,
        @JsonProperty("_type") String typeDetail,
        String query
) {}