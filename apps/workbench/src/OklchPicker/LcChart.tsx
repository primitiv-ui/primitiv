// The bespoke 2D L×C pad (RFC 0010 §5) — the one control the headless library
// has no analogue for. The plane canvas is painted by `useGamutPaint` (the ref
// is owned by the picker); this component overlays the sRGB gamut boundary as
// an SVG polyline, positions a cursor at the current colour, and maps pointer
// drags to a gamut-clamped (l, c) via the pure geometry helpers, emitting
// `onChange`. Canvas drawing stays out of here — only an engine blit touches it.

import {
  useRef,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from "react";

import { max_in_gamut_chroma } from "harmoni-wasm";

import { C_MAX, pointerEventToLc, lcToPoint, nudgeLc } from "./geometry";
import { boundaryPoints } from "./boundary";
import type { OklchValue } from "./types";

/** Lightness samples taken across the boundary curve — smooth without overdraw. */
const BOUNDARY_SAMPLES = 64;

export type LcChartProps = {
  value: OklchValue;
  onChange: (next: { l: number; c: number }) => void;
  planeRef: RefObject<HTMLCanvasElement | null>;
  width: number;
  height: number;
};

export function LcChart({
  value,
  onChange,
  planeRef,
  width,
  height,
}: LcChartProps) {
  const dragging = useRef(false);

  // Both pointer drags and arrow nudges land here: clamp chroma to the engine's
  // in-gamut boundary at the resulting (l, h) before emitting (Principle 1).
  const emitLc = (l: number, c: number) => {
    onChange({ l, c: Math.min(c, max_in_gamut_chroma(l, value.h)) });
  };

  const emit = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const { l, c } = pointerEventToLc(event.clientX, event.clientY, rect, C_MAX);
    emitLc(l, c);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = nudgeLc(value.l, value.c, event.key, event.shiftKey, C_MAX);
    if (!next) return;
    event.preventDefault();
    emitLc(next.l, next.c);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    emit(event);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    emit(event);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const cursor = lcToPoint(value.l, value.c, width, height, C_MAX);

  return (
    <div
      className="lc-chart"
      role="group"
      tabIndex={0}
      aria-label={`Lightness and chroma. Lightness ${value.l.toFixed(
        2,
      )}, chroma ${value.c.toFixed(3)}. Arrow keys adjust, hold Shift for larger steps.`}
      style={{ width, height }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
    >
      <canvas
        ref={planeRef}
        className="lc-chart__plane"
        width={width}
        height={height}
      />
      <svg
        className="lc-chart__overlay"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polyline
          className="lc-chart__boundary"
          points={boundaryPoints(value.h, width, height, C_MAX, BOUNDARY_SAMPLES)}
        />
      </svg>
      <div
        className="lc-chart__cursor"
        aria-hidden="true"
        style={{ left: cursor.x, top: cursor.y }}
      />
    </div>
  );
}
