import init, {
  type Palette,
  type TintMode,
  Swatch,
  generate_neutral_ramp,
  generate_palette_pair,
  tint_neutrals,
} from "harmoni-wasm";
import { useState, useEffect, ChangeEvent } from "react";
import type { ColorConfig, ColorKey, ColorMap } from "./types";
import {
  DEFAULT_COLORS,
  STANDARD_KEYS,
  DEFAULT_LIGHTNESS,
  DEFAULT_DARK_LIGHTNESS,
} from "./constants";

// Regenerate a colour's light and dark palettes together from its current
// config, so the two halves never drift out of sync.
function regeneratePair(config: ColorConfig): ColorConfig {
  const lightnessArray = config.lightnessArray ?? DEFAULT_LIGHTNESS;
  const darkLightnessArray =
    config.darkLightnessArray ?? DEFAULT_DARK_LIGHTNESS;
  const set = generate_palette_pair(
    config.hex,
    lightnessArray,
    darkLightnessArray,
    config.lightPadding ?? 0,
    config.darkPadding ?? 0,
  );

  return {
    ...config,
    lightnessArray,
    darkLightnessArray,
    palette: set.light,
    darkPalette: set.dark,
  };
}

export function useColors() {
  const [wasmReady, setWasmReady] = useState(false);
  const [greyscalePalette, setGreyscalePalette] = useState<Palette>();
  const [neutralWhite, setNeutralWhite] = useState("#ffffff");
  const [neutralBlack, setNeutralBlack] = useState("#000000");
  const [tintSource, setTintSource] = useState<string | null>(null);
  const [tintStrength, setTintStrength] = useState(0.5);
  const [colors, setColors] = useState<ColorMap>(DEFAULT_COLORS);

  useEffect(() => {
    init().then(() => setWasmReady(true));
  }, []);

  useEffect(() => {
    if (!wasmReady) return;

    setColors((prev) => {
      const next = { ...prev };

      for (const key of Object.keys(next) as ColorKey[]) {
        next[key] = regeneratePair(next[key]);
      }

      return next;
    });
  }, [wasmReady]);

  // The neutral ramp regenerates whenever the white or black primitive
  // changes, keeping the two pickers and the ramp in sync. When a tint
  // source is set, the endpoints are tinted first — their lightness is
  // kept, the source hue is layered on — so removing the tint snaps the
  // ramp straight back to the plain white/black the user chose.
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
      white = `oklch(${tinted.white.l} ${tinted.white.c} ${tinted.white.h})`;
      black = `oklch(${tinted.black.l} ${tinted.black.c} ${tinted.black.h})`;
    }

    setGreyscalePalette(
      generate_neutral_ramp(white, black, "Inherit" as TintMode),
    );
  }, [wasmReady, neutralWhite, neutralBlack, tintSource, tintStrength]);

  const handleNeutralWhiteChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNeutralWhite(e.target.value);
  };

  const handleNeutralBlackChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNeutralBlack(e.target.value);
  };

  const handleUseAsTint = (key: ColorKey) => {
    const source = colors[key].palette?.swatches[5];
    if (!source) return;
    setTintSource(`oklch(${source.l} ${source.c} ${source.h})`);
  };

  const handleTintStrengthChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTintStrength(parseFloat(e.target.value) / 100);
  };

  const handleRemoveTint = () => {
    setTintSource(null);
  };

  const handleColorChange =
    (key: ColorKey) => (e: ChangeEvent<HTMLInputElement>) => {
      const hex = e.target.value;

      setColors((prev) => ({
        ...prev,
        [key]: regeneratePair({ ...prev[key], hex }),
      }));
    };

  const handleLightPaddingChange =
    (key: ColorKey) => (e: ChangeEvent<HTMLInputElement>) => {
      const lightPadding = parseFloat(e.target.value) / 100;

      setColors((prev) => ({
        ...prev,
        [key]: regeneratePair({ ...prev[key], lightPadding }),
      }));
    };

  const handleDarkPaddingChange =
    (key: ColorKey) => (e: ChangeEvent<HTMLInputElement>) => {
      const darkPadding = parseFloat(e.target.value) / 100;

      setColors((prev) => ({
        ...prev,
        [key]: regeneratePair({ ...prev[key], darkPadding }),
      }));
    };

  const handleLightnessCurveChange =
    (key: ColorKey, index: number) => (e: ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);

      setColors((prev) => {
        const prevLightness = prev[key].lightnessArray ?? DEFAULT_LIGHTNESS;
        const lightnessArray = prevLightness.map((v, i) =>
          i === index ? value : v,
        );
        return {
          ...prev,
          [key]: regeneratePair({ ...prev[key], lightnessArray }),
        };
      });
    };

  const handleDarkLightnessCurveChange =
    (key: ColorKey, index: number) => (e: ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);

      setColors((prev) => {
        const prevDark =
          prev[key].darkLightnessArray ?? DEFAULT_DARK_LIGHTNESS;
        const darkLightnessArray = prevDark.map((v, i) =>
          i === index ? value : v,
        );
        return {
          ...prev,
          [key]: regeneratePair({ ...prev[key], darkLightnessArray }),
        };
      });
    };

  const handleShiftLeft = (key: ColorKey, targetSwatch?: Swatch) => {
    const hex = `oklch(${targetSwatch?.l} ${targetSwatch?.c} ${targetSwatch?.h})`;

    setColors((prev) => ({
      ...prev,
      [key]: regeneratePair({ ...prev[key], hex }),
    }));
  };

  const handleShiftRight = (key: ColorKey, targetSwatch?: Swatch) => {
    const hex = `oklch(${targetSwatch?.l} ${targetSwatch?.c} ${targetSwatch?.h})`;

    setColors((prev) => ({
      ...prev,
      [key]: regeneratePair({ ...prev[key], hex }),
    }));
  };

  return {
    greyscalePalette,
    neutralWhite,
    neutralBlack,
    tintSource,
    tintStrength,
    handleNeutralWhiteChange,
    handleNeutralBlackChange,
    handleUseAsTint,
    handleTintStrengthChange,
    handleRemoveTint,
    handleColorChange,
    colors,
    handleLightPaddingChange,
    handleDarkPaddingChange,
    handleLightnessCurveChange,
    handleDarkLightnessCurveChange,
    STANDARD_KEYS,
    handleShiftLeft,
    handleShiftRight,
  };
}
