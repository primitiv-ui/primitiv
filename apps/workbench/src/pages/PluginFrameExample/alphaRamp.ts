// Throwaway design-phase preview of the alpha neutral / brand ramps (Path A):
// a single anchor colour shown at a preset, low-biased opacity curve. No engine
// change yet — derived here in TS so the curve can be tuned by eye before the
// harmoni-core `generate_alpha_ramp` is built TDD. See `docs/plugin-ui-design-guide.md`
// and the alpha-ramp design thread.

import { type Swatch } from "harmoni-wasm";

// Opacity per step (50 → 900). Dense at the subtle end — hover, ghost and
// overlay state layers live in the low steps — and accelerating toward opaque.
// These are a candidate to tune by eye in the preview, then lock into the spec.
export const ALPHA_CURVE = [
  0.03, 0.06, 0.1, 0.14, 0.2, 0.3, 0.42, 0.55, 0.72, 0.92,
] as const;

export type AlphaStep = {
  step: number;
  /** The anchor colour at this step's opacity, as a CSS `oklch(L C H / a)`. */
  color: string;
  alpha: number;
};

function stepLabel(index: number): number {
  return index === 0 ? 50 : index * 100;
}

// Build the alpha ramp for one anchor swatch: its colour held constant across
// all ten steps, only the opacity climbing ALPHA_CURVE (Path A — single anchor).
export function alphaStepsFromSwatch(anchor: Swatch): AlphaStep[] {
  return ALPHA_CURVE.map((alpha, index) => ({
    step: stepLabel(index),
    color: `oklch(${anchor.l} ${anchor.c} ${anchor.h} / ${alpha})`,
    alpha,
  }));
}
