import init, {
  type Palette,
  type TintMode,
  Swatch,
  generate_neutral_ramp,
  generate_palette_pair,
  tint_neutrals_duotone,
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
  const [tintSourceLch, setTintSourceLch] = useState<{
    l: number;
    c: number;
    h: number;
  } | null>(null);
  const [tintStrength, setTintStrength] = useState(0.5);
  // Bipolar hue spread in degrees (Option B): 0 reproduces the monotone tint,
  // positive values fan the highlight and shadow anchors apart symmetrically.
  const [tintSpread, setTintSpread] = useState(0);
  // Mid-tone chroma bow in [0, 1]: 0 keeps chroma a straight lerp.
  const [bow, setBow] = useState(0);
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
  // ramp straight back to the plain white/black the user chose. The spread
  // fans the one source hue into a warm highlight and a cool shadow anchor
  // (RFC 0011 Option B); spread 0 collapses both back onto the source.
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

    setGreyscalePalette(
      generate_neutral_ramp(white, black, "Inherit" as TintMode, bow),
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

  const handleNeutralWhiteChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNeutralWhite(e.target.value);
  };

  const handleNeutralBlackChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNeutralBlack(e.target.value);
  };

  // Reseed the white/black neutral anchors from any CSS colour string the engine
  // understands (the OKLCH picker feeds an `oklch(L C H)` string — RFC 0010 §6).
  // The tint blend above is unchanged: it layers the brand hue onto whatever
  // anchors are set, so adopting the picker for the anchors keeps the tint.
  const handleNeutralWhiteValueChange = (seed: string) => {
    setNeutralWhite(seed);
  };

  const handleNeutralBlackValueChange = (seed: string) => {
    setNeutralBlack(seed);
  };

  const handleUseAsTint = (key: ColorKey) => {
    const source = colors[key].palette?.swatches[5];
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

  const handleColorChange =
    (key: ColorKey) => (e: ChangeEvent<HTMLInputElement>) => {
      const hex = e.target.value;

      setColors((prev) => ({
        ...prev,
        [key]: regeneratePair({ ...prev[key], hex }),
      }));
    };

  // Reseed a brand colour from any CSS colour string the engine understands
  // (the OKLCH picker feeds an `oklch(L C H)` string — RFC 0010 §6). The seed
  // is stored on `hex`; `generate_palette_pair` parses it via csscolorparser.
  const handleColorValueChange = (key: ColorKey, seed: string) => {
    setColors((prev) => ({
      ...prev,
      [key]: regeneratePair({ ...prev[key], hex: seed }),
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
    const hex = targetSwatch?.oklch ?? "";

    setColors((prev) => ({
      ...prev,
      [key]: regeneratePair({ ...prev[key], hex }),
    }));
  };

  const handleShiftRight = (key: ColorKey, targetSwatch?: Swatch) => {
    const hex = targetSwatch?.oklch ?? "";

    setColors((prev) => ({
      ...prev,
      [key]: regeneratePair({ ...prev[key], hex }),
    }));
  };

  return {
    wasmReady,
    greyscalePalette,
    neutralWhite,
    neutralBlack,
    tintSource,
    tintStrength,
    tintSpread,
    bow,
    handleNeutralWhiteChange,
    handleNeutralBlackChange,
    handleNeutralWhiteValueChange,
    handleNeutralBlackValueChange,
    handleUseAsTint,
    handleTintStrengthChange,
    handleTintSpreadChange,
    handleBowChange,
    handleRemoveTint,
    handleColorChange,
    handleColorValueChange,
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
