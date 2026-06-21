// Owns the picker's repaint gating and requestAnimationFrame coalescing
// (RFC 0010 §2, §5). On each value change it asks `repaintTargets` which charts
// moved, then schedules a single frame that crosses the wasm boundary only for
// those charts (Principle 2). A pending frame is cancelled when the value
// changes again, and the previous value only advances once a frame actually
// paints — so a cancelled repaint is folded into the next one rather than lost.

import { useEffect, useRef, type RefObject } from "react";

import { paint_lc_plane, paint_hue_strip } from "harmoni-wasm";

import { blitBuffer } from "./paint";
import { repaintTargets } from "./repaint";
import { C_MAX } from "./geometry";
import type { OklchValue } from "./types";

/** The hue strip is one pixel tall; CSS stretches it across the track. */
const STRIP_HEIGHT = 1;

export type UseGamutPaintArgs = {
  value: OklchValue;
  planeRef: RefObject<HTMLCanvasElement | null>;
  stripRef: RefObject<HTMLCanvasElement | null>;
  planeWidth: number;
  planeHeight: number;
  stripWidth: number;
};

export function useGamutPaint({
  value,
  planeRef,
  stripRef,
  planeWidth,
  planeHeight,
  stripWidth,
}: UseGamutPaintArgs): void {
  const prevRef = useRef<OklchValue | null>(null);

  useEffect(() => {
    const targets = repaintTargets(prevRef.current, value);
    if (!targets.plane && !targets.strip) return;

    const id = requestAnimationFrame(() => {
      if (targets.plane) {
        blitBuffer(
          planeRef.current,
          paint_lc_plane(value.h, planeWidth, planeHeight, C_MAX),
          planeWidth,
          planeHeight,
        );
      }
      if (targets.strip) {
        blitBuffer(
          stripRef.current,
          paint_hue_strip(value.l, value.c, stripWidth),
          stripWidth,
          STRIP_HEIGHT,
        );
      }
      prevRef.current = value;
    });

    return () => cancelAnimationFrame(id);
  }, [value, planeRef, stripRef, planeWidth, planeHeight, stripWidth]);
}
