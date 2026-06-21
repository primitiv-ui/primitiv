// Owns the picker's repaint gating and requestAnimationFrame coalescing
// (RFC 0010 §2, §5, §7). On each value/gamut change it asks `repaintTargets`
// which of the four charts moved, then schedules a single frame that crosses the
// wasm boundary only for those charts (Principle 2). Each chart repaints against
// the active gamut and blits in that gamut's colour space, so the sRGB→P3
// extended band stays faithful. A pending frame is cancelled when the inputs
// change again, and the previous state only advances once a frame actually
// paints — so a cancelled repaint is folded into the next one rather than lost.

import { useEffect, useRef, type RefObject } from "react";

import {
  paint_lc_plane,
  paint_hue_strip,
  paint_lightness_strip,
  paint_chroma_strip,
} from "harmoni-wasm";

import { blitBuffer } from "./paint";
import { repaintTargets, type PaintState } from "./repaint";
import { C_MAX } from "./geometry";
import type { Gamut, OklchValue } from "./types";

/** The painted strips are one pixel tall; CSS stretches them across the track. */
const STRIP_HEIGHT = 1;

export type UseGamutPaintArgs = {
  value: OklchValue;
  gamut: Gamut;
  planeRef: RefObject<HTMLCanvasElement | null>;
  hueStripRef: RefObject<HTMLCanvasElement | null>;
  lightnessStripRef: RefObject<HTMLCanvasElement | null>;
  chromaStripRef: RefObject<HTMLCanvasElement | null>;
  planeWidth: number;
  planeHeight: number;
  stripWidth: number;
};

export function useGamutPaint({
  value,
  gamut,
  planeRef,
  hueStripRef,
  lightnessStripRef,
  chromaStripRef,
  planeWidth,
  planeHeight,
  stripWidth,
}: UseGamutPaintArgs): void {
  const prevRef = useRef<PaintState | null>(null);

  useEffect(() => {
    const targets = repaintTargets(prevRef.current, { value, gamut });
    if (
      !targets.plane &&
      !targets.hueStrip &&
      !targets.lightnessStrip &&
      !targets.chromaStrip
    ) {
      return;
    }

    const colorSpace: PredefinedColorSpace =
      gamut === "DisplayP3" ? "display-p3" : "srgb";
    const { l, c, h } = value;

    const id = requestAnimationFrame(() => {
      if (targets.plane) {
        blitBuffer(
          planeRef.current,
          paint_lc_plane(h, planeWidth, planeHeight, C_MAX, gamut),
          planeWidth,
          planeHeight,
          colorSpace,
        );
      }
      if (targets.hueStrip) {
        blitBuffer(
          hueStripRef.current,
          paint_hue_strip(l, c, stripWidth, gamut),
          stripWidth,
          STRIP_HEIGHT,
          colorSpace,
        );
      }
      if (targets.lightnessStrip) {
        blitBuffer(
          lightnessStripRef.current,
          paint_lightness_strip(c, h, stripWidth, gamut),
          stripWidth,
          STRIP_HEIGHT,
          colorSpace,
        );
      }
      if (targets.chromaStrip) {
        blitBuffer(
          chromaStripRef.current,
          paint_chroma_strip(l, h, stripWidth, C_MAX, gamut),
          stripWidth,
          STRIP_HEIGHT,
          colorSpace,
        );
      }
      prevRef.current = { value, gamut };
    });

    return () => cancelAnimationFrame(id);
  }, [
    value,
    gamut,
    planeRef,
    hueStripRef,
    lightnessStripRef,
    chromaStripRef,
    planeWidth,
    planeHeight,
    stripWidth,
  ]);
}
