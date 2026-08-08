import L from "leaflet";

function pinSvg(bg: string, label: string, ring = "#ffffff"): string {
  return `
  <svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 0C7.6 0 0 7.6 0 17c0 12 17 27 17 27s17-15 17-27C34 7.6 26.4 0 17 0z" fill="${bg}"/>
    <circle cx="17" cy="17" r="11" fill="${ring}"/>
    <text x="17" y="22" font-size="12" font-weight="700" text-anchor="middle" fill="${bg}" font-family="system-ui, sans-serif">${label}</text>
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
  return makeIcon(pinSvg("#2563eb", label));
}

export function startIcon() {
  return makeIcon(pinSvg("#16a34a", "A"));
}

export function endIcon() {
  return makeIcon(pinSvg("#dc2626", "B"));
}

export function depotIcon() {
  return makeIcon(pinSvg("#7c3aed", "D"));
}

export function stopIcon(color: string, label: string | number) {
  return makeIcon(pinSvg(color, String(label)));
}
