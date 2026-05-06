export const ICON_MAP: Record<string, string> = {
  "currency-dollar": "💰",
  laptop: "💻",
  utensils: "🍽️",
  car: "🚗",
  home: "🏠",
  paw: "🐾",
  gamepad: "🎮",
  "heart-pulse": "❤️",
  book: "📚",
  tshirt: "👕",
  plane: "✈️",
  gift: "🎁",
};

export function resolveIcon(icon?: string) {
  if (!icon) return "📦";
  return ICON_MAP[icon] ?? icon;
}

export function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function iconBg(hex: string) {
  const h = hex.startsWith("#") ? hex : `#${hex}`;
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.14)`;
}

export function resolveColor(raw?: string, fallback = "#9ca3af") {
  if (!raw) return fallback;
  return raw.startsWith("#") ? raw : `#${raw}`;
}
