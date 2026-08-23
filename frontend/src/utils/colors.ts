/*
 * Route ramp — Canvas Workspace.
 *
 * The brand rule is absolute: "No colour is introduced outside this set."
 * A multi-vehicle map needs a categorical ramp the marketing system never
 * specified, so rather than inventing hues these eight are drawn from the
 * documented palette and ordered for maximum separation against light OSM
 * tiles. Pastels are excluded — they are card fills and vanish as 4px lines.
 *
 * Kept as hex (not oklch tokens) because Leaflet paints these into SVG
 * pathOptions and inline marker markup, outside the CSS custom-property scope.
 */
export const ROUTE_COLORS = [
  "#4262ff", // brand-blue
  "#187574", // moss-dark
  "#fcb900", // brand-yellow-deep
  "#600000", // coral-dark
  "#0fbcb0", // brand-teal
  "#2a41b6", // blue-pressed
  "#746019", // yellow-dark
  "#1c1c1e", // ink
] as const;

export function routeColor(index: number): string {
  return ROUTE_COLORS[index % ROUTE_COLORS.length];
}

/*
 * A pin paints its label inside a white circle, so the label takes the pin's
 * own fill. The three light fills would be illegible that way; each maps to
 * its documented dark counterpart in the same hue family.
 */
const DARK_COUNTERPART: Record<string, string> = {
  "#ffd02f": "#746019", // brand-yellow  -> yellow-dark
  "#fcb900": "#746019", // yellow-deep   -> yellow-dark
  "#0fbcb0": "#187574", // brand-teal    -> moss-dark
};

export function pinLabelColor(fill: string): string {
  return DARK_COUNTERPART[fill.toLowerCase()] ?? fill;
}
