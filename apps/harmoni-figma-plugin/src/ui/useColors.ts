import {
  type Palette,
  type TintMode,
  generate_neutral_ramp,
  generate_palette_pair,
  tint_neutrals,
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
  const [tintStrength, setTintStrength] = useState(0.5);
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

    if (tintSource) {
      const tinted = tint_neutrals(neutralWhite, neutralBlack, tintSource, tintStrength);
      white = tinted.white.oklch;
      black = tinted.black.oklch;
    }

    setEffectiveWhite(white);
    setEffectiveBlack(black);
    setNeutralPalette(generate_neutral_ramp(white, black, "Inherit" as TintMode));
    setNeutralDarkPalette(generate_neutral_ramp(black, white, "Inherit" as TintMode));
  }, [wasmReady, neutralWhite, neutralBlack, tintSource, tintStrength]);

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
  };

  const handleTintStrengthChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTintStrength(parseFloat(e.target.value) / 100);
  };

  const handleRemoveTint = () => {
    setTintSource(null);
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
    neutralPalette,
    neutralDarkPalette,
    brand,
    handleNeutralWhiteChange,
    handleNeutralBlackChange,
    handleBrandChange,
    handleUseAsTint,
    handleTintStrengthChange,
    handleRemoveTint,
    handleLightRampPaddingLeft,
    handleLightRampPaddingRight,
    handleDarkRampPaddingLeft,
    handleDarkRampPaddingRight,
  };
}
