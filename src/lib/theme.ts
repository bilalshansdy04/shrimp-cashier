import { ColorPalette } from "@/types";

export const DEFAULT_PALETTES: ColorPalette[] = [
  {
    id: "shrimp-coral",
    name: "🦐 Shrimp Coral (Default)",
    primary: "#f97316",
    surface: "#1a1c22",
  },
  {
    id: "matcha-zen",
    name: "🌿 Matcha Zen",
    primary: "#10b981",
    surface: "#13221b",
  },
  {
    id: "ocean-breeze",
    name: "🌊 Ocean Breeze",
    primary: "#0284c7",
    surface: "#121b2d",
  },
  {
    id: "kopi-senja",
    name: "☕ Kopi Senja",
    primary: "#d97706",
    surface: "#1e1915",
  },
  {
    id: "royal-violet",
    name: "🍇 Royal Violet",
    primary: "#8b5cf6",
    surface: "#1d182b",
  },
  {
    id: "cherry-rose",
    name: "🌸 Cherry Rose",
    primary: "#f43f5e",
    surface: "#22161b",
  },
];

export function applyPalette(primaryColor: string, surfaceColor: string) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const primary = primaryColor || "#f97316";
  const surface = surfaceColor || "#1a1c22";

  root.style.setProperty("--primary", primary);
  root.style.setProperty("--color-primary", primary);
  root.style.setProperty("--panel-surface", surface);

  try {
    localStorage.setItem("shrimpcashier_primary", primary);
    localStorage.setItem("shrimpcashier_surface", surface);
  } catch (e) {}
}

export function loadSavedPalette(): { primary: string; surface: string } {
  if (typeof window === "undefined") {
    return { primary: "#f97316", surface: "#1a1c22" };
  }

  const primary = localStorage.getItem("shrimpcashier_primary") || "#f97316";
  const surface = localStorage.getItem("shrimpcashier_surface") || "#1a1c22";
  return { primary, surface };
}
