// Ported from apps/harmoni-figma-plugin/src/ui/types.ts.

import { type Palette } from "harmoni-wasm";

export type BrandConfig = {
  hex: string;
  lightPalette?: Palette;
  darkPalette?: Palette;
  lightnessArray?: number[];
  darkLightnessArray?: number[];
  lightRampPaddingLeft?: number;
  lightRampPaddingRight?: number;
  darkRampPaddingLeft?: number;
  darkRampPaddingRight?: number;
};
