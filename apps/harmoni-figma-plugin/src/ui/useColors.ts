import {
  type Palette,
  type TintMode,
  generate_neutral_ramp,
  generate_palette_pair,
  tint_neutrals_duotone,
} from "harmoni-wasm";
import { useState, useEffect, ChangeEvent } from "react";
import { initEngine } from "./engine";
import type { BrandConfig } from "./types";
import {
  DEFAULT_BRAND_HEX,
  DEFAULT_LIGHTNESS,
  DEFAULT_DARK_LIGHTNESS,
} from "./constants";

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
  return { ...config, lightnessArray, darkLightnessArray, lightPalette: lightSet.light, darkPalette: darkSet.dark };
}

export function useColors() {
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
    initEngine().then(() => setWasmReady(true));
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
    setNeutralPalette(generate_neutral_ramp(white, black, "Inherit" as TintMode, bow));
    setNeutralDarkPalette(generate_neutral_ramp(black, white, "Inherit" as TintMode, bow));
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

  const handleNeutralWhiteChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNeutralWhite(e.target.value);
  };

  const handleNeutralBlackChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNeutralBlack(e.target.value);
  };

  const handleBrandChange = (e: ChangeEvent<HTMLInputElement>) => {
    setBrand((prev) => regenerateBrand({ ...prev, hex: e.target.value }));
  };

  const handleUseAsTint = () => {
    const source = brand.lightPalette?.swatches[5];
    if (!source) return;
    setTintSource(source.oklch);
    setTintSourceLch({ l: source.l, c: source.c, h: source.h });
  };

  const handleTintStrengthChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTintStrength(parseFloat(e.target.value) / 100);
  };

  const handleTintSpreadChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTintSpread(parseFloat(e.target.value));
  };

  const handleBowChange = (e: ChangeEvent<HTMLInputElement>) => {
    setBow(parseFloat(e.target.value) / 100);
  };

  const handleRemoveTint = () => {
    setTintSource(null);
    setTintSourceLch(null);
  };

  const handleLightRampPaddingLeft = (e: ChangeEvent<HTMLInputElement>) => {
    const lightRampPaddingLeft = parseFloat(e.target.value) / 100;
    setBrand((prev) => regenerateBrand({ ...prev, lightRampPaddingLeft }));
  };

  const handleLightRampPaddingRight = (e: ChangeEvent<HTMLInputElement>) => {
    const lightRampPaddingRight = parseFloat(e.target.value) / 100;
    setBrand((prev) => regenerateBrand({ ...prev, lightRampPaddingRight }));
  };

  const handleDarkRampPaddingLeft = (e: ChangeEvent<HTMLInputElement>) => {
    const darkRampPaddingLeft = parseFloat(e.target.value) / 100;
    setBrand((prev) => regenerateBrand({ ...prev, darkRampPaddingLeft }));
  };

  const handleDarkRampPaddingRight = (e: ChangeEvent<HTMLInputElement>) => {
    const darkRampPaddingRight = parseFloat(e.target.value) / 100;
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
    handleNeutralWhiteChange,
    handleNeutralBlackChange,
    handleBrandChange,
    handleUseAsTint,
    handleTintStrengthChange,
    handleTintSpreadChange,
    handleBowChange,
    handleRemoveTint,
    handleLightRampPaddingLeft,
    handleLightRampPaddingRight,
    handleDarkRampPaddingLeft,
    handleDarkRampPaddingRight,
  };
}
