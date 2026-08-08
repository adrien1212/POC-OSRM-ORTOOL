// Distinct, accessible colors for vehicle routes.
export const ROUTE_COLORS = [
  "#2563eb",
  "#16a34a",
  "#ea580c",
  "#9333ea",
  "#dc2626",
  "#0891b2",
  "#ca8a04",
  "#db2777",
] as const;

export function routeColor(index: number): string {
  return ROUTE_COLORS[index % ROUTE_COLORS.length];
}
