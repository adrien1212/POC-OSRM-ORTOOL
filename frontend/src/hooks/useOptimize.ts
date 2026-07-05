import { useMutation } from "@tanstack/react-query";
import { optimizeRoute } from "@/api/optimizeRoute";
import type {
  BackendOptimizeRouteRequest,
  BackendOptimizeRouteResponse,
} from "@/types";

export function useOptimize() {
  return useMutation<
    BackendOptimizeRouteResponse,
    Error,
    BackendOptimizeRouteRequest
  >({
    mutationFn: optimizeRoute,
  });
}
