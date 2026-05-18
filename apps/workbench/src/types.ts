import { Palette } from "harmoni-wasm";

export type ColorKey =
  | "red"
  | "yellow"
  | "lime"
  | "green"
  | "blue"
  | "indigo"
  | "purple"
  | "pink";

export type ColorConfig = {
  hex: string;
  palette?: Palette;
  darkPalette?: Palette;
  lightnessArray?: number[];
  darkLightnessArray?: number[];
  lightPadding?: number;
  darkPadding?: number;
};

export type ColorMap = Record<ColorKey, ColorConfig>;
