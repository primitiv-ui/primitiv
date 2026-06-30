// Throwaway preview row: the alpha companion to a solid PluginPalette, rendered
// on a checkerboard so transparency reads. The anchor is the ramp's veil colour
// — the dark/light end for the neutral ramps (index 9), the brand mid-swatch
// (index 5). Path A: one anchor colour, opacity climbing ALPHA_CURVE.

import { type Palette } from "harmoni-wasm";

import { alphaStepsFromSwatch } from "./alphaRamp";

export type PluginAlphaStripProps = {
  palette?: Palette;
  /** Which solid swatch supplies the constant tint colour for the whole ramp. */
  anchorIndex: number;
};

export function PluginAlphaStrip({ palette, anchorIndex }: PluginAlphaStripProps) {
  const anchor = palette?.swatches?.[anchorIndex];
  if (!anchor) return null;

  return (
    <div className="pf-alpha-strip">
      {alphaStepsFromSwatch(anchor).map(({ step, color, alpha }) => (
        <div className="pf-alpha-strip__swatch" key={step}>
          <div className="pf-alpha-strip__checker">
            <div className="pf-alpha-strip__fill" style={{ background: color }} />
          </div>
          <p className="pf-alpha-strip__label">{Math.round(alpha * 100)}%</p>
        </div>
      ))}
    </div>
  );
}
