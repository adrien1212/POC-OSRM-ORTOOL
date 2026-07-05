package fr.adriencaubel.vrp.controller;

import fr.adriencaubel.vrp.service.Coordonees;
import fr.adriencaubel.vrp.service.RouteOptimizationService;
import fr.adriencaubel.vrp.service.osrmapi.OSRMDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/coordonnees")
@RequiredArgsConstructor
public class CoordonneesController {

    @GetMapping
    public ResponseEntity<Coordonees> getCoordonnee(@RequestParam String adresse) {
        Coordonees coordonees = RouteOptimizationService.adresseToCoordonne(adresse);
        return ResponseEntity.ok(coordonees);
    }

    @GetMapping("/matrix")
    public ResponseEntity<OSRMDTO> matrix(@RequestParam String coordonnees) {
        String[] c = coordonnees.split(";");
        List<Coordonees> coordonees = new ArrayList<>();
        for(String s : c) {
            String[] longlat = s.split(",");
            Coordonees coordonees1 = new Coordonees(Double.valueOf(longlat[0]), Double.valueOf(longlat[1]), null);
            coordonees.add(coordonees1);
        }

        return ResponseEntity.ok(RouteOptimizationService.distanceMatrix(coordonees));
    }
}
