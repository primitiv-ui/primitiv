import type { ColorMap, ColorKey } from "./types";

export const DEFAULT_LIGHTNESS: number[] = [0.97, 0.91, 0.83, 0.76, 0.67, 0.55, 0.45, 0.32, 0.22, 0.15];

// Mirrors harmoni-core's TARGET_LIGHTNESS_DARK — the ascending shape
// reference for the anchored dark palette.
export const DEFAULT_DARK_LIGHTNESS: number[] = [0.21, 0.25, 0.3, 0.37, 0.46, 0.55, 0.66, 0.77, 0.87, 0.94];

export const DEFAULT_COLORS: ColorMap = {
  red: { hex: "#EF4444" },
  yellow: { hex: "#F59E0B" },
  lime: { hex: "#9eb22e" },
  green: { hex: "#10B981" },
  blue: { hex: "#3B82F6" },
  indigo: { hex: "#6366F1" },
  purple: { hex: "#8B5CF6" },
  pink: { hex: "#e0218a" },
};

export const STANDARD_KEYS: ColorKey[] = [
  "red",
  "yellow",
  "lime",
  "green",
  "blue",
  "indigo",
  "purple",
  "pink",
];
