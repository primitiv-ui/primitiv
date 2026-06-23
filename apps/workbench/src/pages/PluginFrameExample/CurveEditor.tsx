// The Supa-style lightness-curve editor: one vertical painted slider per swatch
// step, column-aligned under the ramp. Each column's track fills from the bottom
// with that swatch's own colour up to a thin horizontal-line thumb at the step's
// lightness; together the thumb lines trace the ramp's lightness curve. Dragging
// a column re-generates the ramp through the engine (RFC 0010 §9 plugin work).

import { Slider } from "@primitiv-ui/react";
import { type Palette } from "harmoni-wasm";

function stepLabel(index: number): number {
  return index === 0 ? 50 : index * 100;
}

export type CurveEditorProps = {
  palette?: Palette;
  curve?: number[];
  onChange: (index: number, value: number) => void;
  /** Accessible name for the whole curve, e.g. `"Brand light"`. */
  label: string;
};

export function CurveEditor({ palette, curve, onChange, label }: CurveEditorProps) {
  if (!palette?.swatches || !curve) return null;

  return (
    <div className="pf-curve" role="group" aria-label={`${label} lightness curve`}>
      {palette.swatches.map((swatch, index) => (
        <div className="pf-curve__col" key={index}>
          <Slider.Root
            className="pf-curve-slider"
            orientation="vertical"
            aria-label={`${label} ${stepLabel(index)} lightness`}
            min={0}
            max={1}
            step={0.01}
            value={[curve[index] ?? 0]}
            onValueChange={([next]) => onChange(index, next)}
          >
            <Slider.Track className="pf-curve-slider__track">
              <Slider.Range
                className="pf-curve-slider__range"
                style={{ background: swatch.oklch }}
              />
            </Slider.Track>
            <Slider.Thumb className="pf-curve-slider__thumb" />
          </Slider.Root>
        </div>
      ))}
    </div>
  );
}
