// The alpha companion to a solid PluginPalette, rendered on a checkerboard so
// transparency reads. The ramp now comes from the engine (`generate_alpha_ramp`,
// Path A): the anchor is the ramp's veil colour — the dark/light end for the
// neutral ramps (index 9), the brand mid-swatch (index 5) — held constant while
// opacity climbs the shared ALPHA_CURVE baked into harmoni-core.

import { generate_alpha_ramp, type Palette } from "harmoni-wasm";

export type PluginAlphaStripProps = {
  palette?: Palette;
  /** Which solid swatch supplies the constant tint colour for the whole ramp. */
  anchorIndex: number;
};

export function PluginAlphaStrip({ palette, anchorIndex }: PluginAlphaStripProps) {
  const anchor = palette?.swatches?.[anchorIndex];
  if (!anchor) return null;

  const { swatches } = generate_alpha_ramp(anchor.oklch);

  return (
    <div className="pf-alpha-strip">
      {swatches.map(({ step, oklch, alpha }) => (
        <div className="pf-alpha-strip__swatch" key={step}>
          <div className="pf-alpha-strip__checker">
            <div className="pf-alpha-strip__fill" style={{ background: oklch }} />
          </div>
          <p className="pf-alpha-strip__label">{Math.round(alpha * 100)}%</p>
        </div>
      ))}
    </div>
  );
}
