package fr.adriencaubel.vrp.controller;

import fr.adriencaubel.vrp.controller.input.OptimizeRouteRequest;
import fr.adriencaubel.vrp.controller.output.OptimizeRouteResponse;
import fr.adriencaubel.vrp.service.RouteOptimizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/v1/routes")
@RequiredArgsConstructor
public class RouteOptimizationController {

    private final RouteOptimizationService routeOptimizationService;

    @PostMapping("/optimize")
    public OptimizeRouteResponse optimize(@RequestBody OptimizeRouteRequest request) {
        return routeOptimizationService.optimize(request);
    }
}