import L from "leaflet";
import { pinLabelColor } from "./colors";

/*
 * Map pins — Canvas Workspace.
 *
 * Brand black is the dominant marker; yellow is spent on exactly one thing,
 * the depot, which is the map's signature moment. Labels use the brand face
 * at weight 600 (the system never uses 700).
 */
const BRAND = {
  ink: "#1c1c1e",
  yellow: "#ffd02f",
  blue: "#4262ff",
  coralDark: "#600000",
  canvas: "#ffffff",
} as const;

const FONT = '"Roobert PRO", Figtree, system-ui, sans-serif';

function pinSvg(bg: string, label: string): string {
  const ring = BRAND.canvas;
  const labelFill = pinLabelColor(bg);
  return `
  <svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 0C7.6 0 0 7.6 0 17c0 12 17 27 17 27s17-15 17-27C34 7.6 26.4 0 17 0z" fill="${bg}"/>
    <circle cx="17" cy="17" r="11" fill="${ring}"/>
    <text x="17" y="22" font-size="12" font-weight="600" text-anchor="middle" fill="${labelFill}" font-family='${FONT}'>${label}</text>
  </svg>`;
}

function makeIcon(html: string): L.DivIcon {
  return L.divIcon({
    html,
    className: "vrp-marker",
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -40],
  });
}

export function deliveryIcon(label: string) {
  return makeIcon(pinSvg(BRAND.blue, label));
}

export function startIcon() {
  return makeIcon(pinSvg(BRAND.ink, "A"));
}

export function endIcon() {
  return makeIcon(pinSvg(BRAND.coralDark, "B"));
}

export function depotIcon() {
  return makeIcon(pinSvg(BRAND.yellow, "D"));
}

export function stopIcon(color: string, label: string | number) {
  return makeIcon(pinSvg(color, String(label)));
}
