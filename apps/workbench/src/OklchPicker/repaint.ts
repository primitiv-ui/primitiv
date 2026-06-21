// Repaint gating for the picker's charts (RFC 0010 §2). Each batched
// `paint_*` call is the expensive part of a repaint, so a chart is only
// repainted when an axis it depends on actually moves: the L×C plane is fixed
// at the current hue, so it repaints only when H changes; the hue strip is
// fixed at the current (L, C), so it repaints only when L or C change.

import type { OklchValue } from "./types";

/** Which charts must repaint for a transition from `prev` to `next`. */
export type RepaintTargets = {
  plane: boolean;
  strip: boolean;
};

/**
 * Decides which charts to repaint for the move from `prev` to `next`. A `null`
 * `prev` is the first paint and repaints both.
 */
export function repaintTargets(
  prev: OklchValue | null,
  next: OklchValue,
): RepaintTargets {
  if (prev === null) {
    return { plane: true, strip: true };
  }
  return {
    plane: prev.h !== next.h,
    strip: prev.l !== next.l || prev.c !== next.c,
  };
}
