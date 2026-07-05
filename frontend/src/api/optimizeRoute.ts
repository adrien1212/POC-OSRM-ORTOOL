import axios from "axios";
import type {
  BackendOptimizeRouteRequest,
  BackendOptimizeRouteResponse,
} from "@/types";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  headers: { "Content-Type": "application/json" },
});

export async function optimizeRoute(
  req: BackendOptimizeRouteRequest,
): Promise<BackendOptimizeRouteResponse> {
  const { data } = await client.post<BackendOptimizeRouteResponse>(
    "/api/v1/routes/optimize",
    req,
  );
  return data;
}
