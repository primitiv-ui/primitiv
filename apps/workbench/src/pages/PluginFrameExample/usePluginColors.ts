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
  tint_neutrals_duotone,
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
  const [tintSourceLch, setTintSourceLch] = useState<{
    l: number;
    c: number;
    h: number;
  } | null>(null);
  const [tintStrength, setTintStrength] = useState(0.5);
  // Bipolar hue spread in degrees (RFC 0011 Option B): 0 reproduces the
  // monotone tint; positive values fan the highlight and shadow anchors apart.
  const [tintSpread, setTintSpread] = useState(0);
  // Mid-tone chroma bow in [0, 1]: 0 keeps chroma a straight lerp.
  const [bow, setBow] = useState(0);
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

    if (tintSource && tintSourceLch) {
      const { l, c, h } = tintSourceLch;
      const highlight = `oklch(${l} ${c} ${h + tintSpread})`;
      const shadow = `oklch(${l} ${c} ${h - tintSpread})`;
      const tinted = tint_neutrals_duotone(
        neutralWhite,
        neutralBlack,
        highlight,
        shadow,
        tintStrength,
      );
      white = tinted.white.oklch;
      black = tinted.black.oklch;
    }

    setEffectiveWhite(white);
    setEffectiveBlack(black);
    setNeutralPalette(
      generate_neutral_ramp(white, black, "Inherit" as TintMode, bow),
    );
    setNeutralDarkPalette(
      generate_neutral_ramp(black, white, "Inherit" as TintMode, bow),
    );
  }, [
    wasmReady,
    neutralWhite,
    neutralBlack,
    tintSource,
    tintSourceLch,
    tintStrength,
    tintSpread,
    bow,
  ]);

  const setBrandHex = (hex: string) => {
    setBrand((prev) => regenerateBrand({ ...prev, hex }));
  };

  // Per-swatch lightness-curve edits (the Supa-style column sliders): replace one
  // entry of the light (or dark) lightness array and regenerate. The light ramp
  // is driven by `lightnessArray`, the dark ramp by `darkLightnessArray`.
  const setLightCurve = (index: number, value: number) => {
    setBrand((prev) => {
      const array = [...(prev.lightnessArray ?? DEFAULT_LIGHTNESS)];
      array[index] = value;
      return regenerateBrand({ ...prev, lightnessArray: array });
    });
  };

  const setDarkCurve = (index: number, value: number) => {
    setBrand((prev) => {
      const array = [...(prev.darkLightnessArray ?? DEFAULT_DARK_LIGHTNESS)];
      array[index] = value;
      return regenerateBrand({ ...prev, darkLightnessArray: array });
    });
  };

  const handleUseAsTint = () => {
    const source = brand.lightPalette?.swatches[5];
    if (!source) return;
    setTintSource(source.oklch);
    setTintSourceLch({ l: source.l, c: source.c, h: source.h });
  };

  const handleRemoveTint = () => {
    setTintSource(null);
    setTintSourceLch(null);
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
    tintSpread,
    bow,
    neutralPalette,
    neutralDarkPalette,
    brand,
    setNeutralWhite,
    setNeutralBlack,
    setBrandHex,
    setLightCurve,
    setDarkCurve,
    setTintStrength,
    setTintSpread,
    setBow,
    handleUseAsTint,
    handleRemoveTint,
    setLightRampPaddingLeft,
    setLightRampPaddingRight,
    setDarkRampPaddingLeft,
    setDarkRampPaddingRight,
  };
}
