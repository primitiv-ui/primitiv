// The hue slider (RFC 0010 §5) — composes the headless `Slider` (Principle 6)
// for keyboard, ARIA and thumb positioning, and uses an engine-painted canvas
// as its track. The canvas is filled by the picker's `useGamutPaint` via the
// shared `stripRef`; this component only lays the parts out and forwards the
// thumb's value back as a hue. No registry sheet exists for Slider, so the
// chrome is styled against its contract with --primitiv-* tokens.

import { type RefObject } from "react";
import { Slider } from "@primitiv-ui/react";

export type HueSliderProps = {
  hue: number;
  onChange: (hue: number) => void;
  stripRef: RefObject<HTMLCanvasElement | null>;
  width: number;
};

export function HueSlider({ hue, onChange, stripRef, width }: HueSliderProps) {
  return (
    <Slider.Root
      className="hue-slider"
      aria-label="Hue"
      min={0}
      max={360}
      step={1}
      value={[hue]}
      onValueChange={([next]) => onChange(next)}
    >
      <canvas
        ref={stripRef}
        className="hue-slider__strip"
        width={width}
        height={1}
        aria-hidden="true"
      />
      <Slider.Track className="hue-slider__track" />
      <Slider.Thumb className="hue-slider__thumb" />
    </Slider.Root>
  );
}
