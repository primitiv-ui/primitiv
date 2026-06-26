// A standalone painted lightness slider (RFC 0010 §6) — the white/black neutral
// anchors need only a lightness control (chroma fixed, hue irrelevant; colour
// comes from the brand-hue tint), so this reuses the picker's `AxisSlider` for an
// identical painted track + white thumb, and paints the track itself rather than
// relying on the full picker's `useGamutPaint` orchestration. The track is the
// engine's `paint_lightness_strip` at the held chroma/hue, so it stays a single
// source of truth with the charts and repaints when those (or the gamut/size)
// change. Lifts into the plugin alongside the picker (Principle 3).

import { useEffect, useRef } from "react";

import { paint_lightness_strip } from "harmoni-wasm";

import { AxisSlider } from "./AxisSlider";
import { useElementSize } from "./useElementSize";
import { blitBuffer } from "./paint";
import { CHANNELS } from "./channels";
import type { Gamut } from "./types";

export type LightnessSliderProps = {
  /** The lightness, `0..1`. */
  value: number;
  onChange: (lightness: number) => void;
  /** Chroma the track is painted at (default 0 — a neutral grey ramp). */
  chroma?: number;
  /** Hue the track is painted at (default 0; immaterial at chroma 0). */
  hue?: number;
  /** Gamut the track is painted against (default sRGB). */
  gamut?: Gamut;
  /** Lowest selectable lightness (default `CHANNELS.l.min`). Clamps the thumb
   *  and the painted track together, so the gradient never shows a value the
   *  thumb can't reach — e.g. a near-white anchor floored above mid-grey. */
  min?: number;
  /** Highest selectable lightness (default `CHANNELS.l.max`). */
  max?: number;
  /** Accessible name for the slider (default `"Lightness"`). */
  label?: string;
};

export function LightnessSlider({
  value,
  onChange,
  chroma = 0,
  hue = 0,
  gamut = "Srgb",
  min = CHANNELS.l.min,
  max = CHANNELS.l.max,
  label = "Lightness",
}: LightnessSliderProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLCanvasElement>(null);
  const { width } = useElementSize(wrapRef);
  const stripWidth = Math.max(1, Math.round(width));

  useEffect(() => {
    const colorSpace: PredefinedColorSpace =
      gamut === "DisplayP3" ? "display-p3" : "srgb";
    blitBuffer(
      stripRef.current,
      paint_lightness_strip(chroma, hue, stripWidth, gamut, min, max),
      stripWidth,
      1,
      colorSpace,
    );
  }, [chroma, hue, gamut, stripWidth, min, max]);

  return (
    <div ref={wrapRef} className="lightness-slider">
      <AxisSlider
        label={label}
        modifier="lightness"
        value={value}
        min={min}
        max={max}
        step={CHANNELS.l.step}
        onChange={onChange}
        stripRef={stripRef}
        width={stripWidth}
      />
    </div>
  );
}
