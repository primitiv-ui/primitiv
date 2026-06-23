// Ported from apps/harmoni-figma-plugin/src/ui/useColors.ts — the plugin's colour
// engine, running here in the workbench so the plugin UI can be developed in a
// real browser (RFC 0010 §9). Two adaptations: the engine is initialised with the
// workbench's plain `init()` (no inlined wasm URL — vite serves the asset), and
// the DOM-event handlers are replaced by plain value setters so the OKLCH picker
// and LightnessSlider can drive it. Export-to-Figma is intentionally absent.

import {
  type Palette,
  type TintMode,
  generate_neutral_ramp,
  generate_palette_pair,
  tint_neutrals,
} from "harmoni-wasm";
import init from "harmoni-wasm";
import { useState, useEffect } from "react";

import type { BrandConfig } from "./pluginTypes";
import {
  DEFAULT_BRAND_HEX,
  DEFAULT_LIGHTNESS,
  DEFAULT_DARK_LIGHTNESS,
} from "./pluginConstants";

function regenerateBrand(config: BrandConfig): BrandConfig {
  const lightnessArray = config.lightnessArray ?? DEFAULT_LIGHTNESS;
  const darkLightnessArray = config.darkLightnessArray ?? DEFAULT_DARK_LIGHTNESS;
  const lightSet = generate_palette_pair(
    config.hex,
    lightnessArray,
    darkLightnessArray,
    config.lightRampPaddingLeft ?? 0,
    config.lightRampPaddingRight ?? 0,
  );
  const darkSet = generate_palette_pair(
    config.hex,
    lightnessArray,
    darkLightnessArray,
    config.darkRampPaddingLeft ?? 0,
    config.darkRampPaddingRight ?? 0,
  );
  return {
    ...config,
    lightnessArray,
    darkLightnessArray,
    lightPalette: lightSet.light,
    darkPalette: darkSet.dark,
  };
}

export function usePluginColors() {
  const [wasmReady, setWasmReady] = useState(false);
  const [neutralWhite, setNeutralWhite] = useState("#ffffff");
  const [neutralBlack, setNeutralBlack] = useState("#000000");
  const [effectiveWhite, setEffectiveWhite] = useState("#ffffff");
  const [effectiveBlack, setEffectiveBlack] = useState("#000000");
  const [tintSource, setTintSource] = useState<string | null>(null);
  const [tintStrength, setTintStrength] = useState(0.5);
  const [neutralPalette, setNeutralPalette] = useState<Palette>();
  const [neutralDarkPalette, setNeutralDarkPalette] = useState<Palette>();
  const [brand, setBrand] = useState<BrandConfig>({ hex: DEFAULT_BRAND_HEX });

  useEffect(() => {
    init().then(() => setWasmReady(true));
  }, []);

  useEffect(() => {
    if (!wasmReady) return;
    setBrand((prev) => regenerateBrand(prev));
  }, [wasmReady]);

  useEffect(() => {
    if (!wasmReady) return;

    let white = neutralWhite;
    let black = neutralBlack;

    if (tintSource) {
      const tinted = tint_neutrals(
        neutralWhite,
        neutralBlack,
        tintSource,
        tintStrength,
      );
      white = tinted.white.oklch;
      black = tinted.black.oklch;
    }

    setEffectiveWhite(white);
    setEffectiveBlack(black);
    setNeutralPalette(generate_neutral_ramp(white, black, "Inherit" as TintMode));
    setNeutralDarkPalette(
      generate_neutral_ramp(black, white, "Inherit" as TintMode),
    );
  }, [wasmReady, neutralWhite, neutralBlack, tintSource, tintStrength]);

  const setBrandHex = (hex: string) => {
    setBrand((prev) => regenerateBrand({ ...prev, hex }));
  };

  const handleUseAsTint = () => {
    const source = brand.lightPalette?.swatches[5];
    if (!source) return;
    setTintSource(source.oklch);
  };

  const handleRemoveTint = () => {
    setTintSource(null);
  };

  const setLightRampPaddingLeft = (lightRampPaddingLeft: number) => {
    setBrand((prev) => regenerateBrand({ ...prev, lightRampPaddingLeft }));
  };

  const setLightRampPaddingRight = (lightRampPaddingRight: number) => {
    setBrand((prev) => regenerateBrand({ ...prev, lightRampPaddingRight }));
  };

  const setDarkRampPaddingLeft = (darkRampPaddingLeft: number) => {
    setBrand((prev) => regenerateBrand({ ...prev, darkRampPaddingLeft }));
  };

  const setDarkRampPaddingRight = (darkRampPaddingRight: number) => {
    setBrand((prev) => regenerateBrand({ ...prev, darkRampPaddingRight }));
  };

  return {
    wasmReady,
    neutralWhite,
    neutralBlack,
    effectiveWhite,
    effectiveBlack,
    tintSource,
    tintStrength,
    neutralPalette,
    neutralDarkPalette,
    brand,
    setNeutralWhite,
    setNeutralBlack,
    setBrandHex,
    setTintStrength,
    handleUseAsTint,
    handleRemoveTint,
    setLightRampPaddingLeft,
    setLightRampPaddingRight,
    setDarkRampPaddingLeft,
    setDarkRampPaddingRight,
  };
}
