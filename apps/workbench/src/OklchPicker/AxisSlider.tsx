// A painted 1-D axis slider (RFC 0010 §4, §5) — composes the headless `Slider`
// (Principle 6) for keyboard, ARIA and thumb positioning, over an engine-painted
// canvas track. The canvas is filled by the picker's `useGamutPaint` via the
// shared `stripRef`; this component only lays the parts out and forwards the
// thumb's value. One generic control backs all three axes (L, C, H): each track
// shows that axis's gradient at the current value of the others, with the
// out-of-gamut region falling transparent, so you can read the gamut range as
// you drag (the oklch.com editing model). No registry sheet exists for Slider,
// so the chrome is styled against its contract with --primitiv-* tokens.

import { type RefObject } from "react";
import { Slider } from "@primitiv-ui/react";

export type AxisSliderProps = {
  /** Accessible name for the axis, e.g. `"Lightness"`. */
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  stripRef: RefObject<HTMLCanvasElement | null>;
  width: number;
  /** Optional modifier appended to the BEM block for per-axis styling. */
  modifier?: string;
};

export function AxisSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  stripRef,
  width,
  modifier,
}: AxisSliderProps) {
  const block = modifier ? `axis-slider axis-slider--${modifier}` : "axis-slider";
  return (
    <Slider.Root
      className={block}
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={[value]}
      onValueChange={([next]) => onChange(next)}
    >
      <canvas
        ref={stripRef}
        className="axis-slider__strip"
        width={width}
        height={1}
        aria-hidden="true"
      />
      <Slider.Track className="axis-slider__track" />
      <Slider.Thumb className="axis-slider__thumb" aria-label={label} />
    </Slider.Root>
  );
}
