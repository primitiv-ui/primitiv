// Repaint gating for the picker's charts (RFC 0010 §2, §7). Each batched
// `paint_*` call is the expensive part of a repaint, so a chart is only
// repainted when an axis it depends on actually moves — the user sees each
// painted track shift in relation to the others as they drag (the oklch.com
// editing model). The gamut is a fifth axis: changing it re-renders every chart
// against the new boundary.
//
//   - plane: Hue chart (L×C at the current H)  → repaints when H changes
//   - lightnessPlane: Lightness chart (H×C at L) → repaints when L changes
//   - chromaPlane: Chroma chart (H×L at C)       → repaints when C changes
//   - hue strip (at the current L, C)   → repaints when L or C changes
//   - lightness strip (at the current C, H) → repaints when C or H changes
//   - chroma strip (at the current L, H)    → repaints when L or H changes

import type { Gamut, OklchValue } from "./types";

/** The charts' shared backing-store size (plane width×height; strip width = width). */
export type ChartSize = { width: number; height: number };

/**
 * A picker render's full chart inputs: the colour, the active gamut, and the
 * charts' backing-store size (a resize re-renders every chart at the new size).
 */
export type PaintState = { value: OklchValue; gamut: Gamut; size: ChartSize };

/** Which charts must repaint for a transition from `prev` to `next`. */
export type RepaintTargets = {
  plane: boolean;
  lightnessPlane: boolean;
  chromaPlane: boolean;
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
      lightnessPlane: true,
      chromaPlane: true,
      hueStrip: true,
      lightnessStrip: true,
      chromaStrip: true,
    };
  }

  const sizeChanged =
    prev.size.width !== next.size.width ||
    prev.size.height !== next.size.height;
  // A gamut or size change re-renders every chart; otherwise each repaints only
  // for the axis it depends on.
  const all = prev.gamut !== next.gamut || sizeChanged;
  const lChanged = prev.value.l !== next.value.l;
  const cChanged = prev.value.c !== next.value.c;
  const hChanged = prev.value.h !== next.value.h;

  return {
    plane: all || hChanged,
    lightnessPlane: all || lChanged,
    chromaPlane: all || cChanged,
    hueStrip: all || lChanged || cChanged,
    lightnessStrip: all || cChanged || hChanged,
    chromaStrip: all || lChanged || hChanged,
  };
}
