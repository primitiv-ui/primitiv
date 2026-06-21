// Repaint gating for the picker's charts (RFC 0010 §2, §7). Each batched
// `paint_*` call is the expensive part of a repaint, so a chart is only
// repainted when an axis it depends on actually moves — the user sees each
// painted track shift in relation to the others as they drag (the oklch.com
// editing model). The gamut is a fifth axis: changing it re-renders every chart
// against the new boundary.
//
//   - plane (L×C at the current hue)    → repaints when H changes
//   - hue strip (at the current L, C)   → repaints when L or C changes
//   - lightness strip (at the current C, H) → repaints when C or H changes
//   - chroma strip (at the current L, H)    → repaints when L or H changes

import type { Gamut, OklchValue } from "./types";

/** A picker render's full chart inputs: the colour plus the active gamut. */
export type PaintState = { value: OklchValue; gamut: Gamut };

/** Which charts must repaint for a transition from `prev` to `next`. */
export type RepaintTargets = {
  plane: boolean;
  hueStrip: boolean;
  lightnessStrip: boolean;
  chromaStrip: boolean;
};

/**
 * Decides which charts to repaint for the move from `prev` to `next`. A `null`
 * `prev` is the first paint and repaints everything, as does any gamut change.
 */
export function repaintTargets(
  prev: PaintState | null,
  next: PaintState,
): RepaintTargets {
  if (prev === null) {
    return {
      plane: true,
      hueStrip: true,
      lightnessStrip: true,
      chromaStrip: true,
    };
  }

  const gamutChanged = prev.gamut !== next.gamut;
  const lChanged = prev.value.l !== next.value.l;
  const cChanged = prev.value.c !== next.value.c;
  const hChanged = prev.value.h !== next.value.h;

  return {
    plane: gamutChanged || hChanged,
    hueStrip: gamutChanged || lChanged || cChanged,
    lightnessStrip: gamutChanged || cChanged || hChanged,
    chromaStrip: gamutChanged || lChanged || hChanged,
  };
}
