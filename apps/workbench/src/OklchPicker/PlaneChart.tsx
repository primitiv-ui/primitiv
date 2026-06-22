// The reusable 2D plane chart (RFC 0010 §5) — the one control the headless
// library has no analogue for, generalised from the original L×C pad so all
// three charts of the oklch.com "net" share it. Each instance plots two OkLCH
// axes (the third is held fixed) over a canvas the picker's `useGamutPaint`
// blits; this component overlays an optional gamut-boundary polyline, the shared
// crosshair guide lines that link the charts, and a draggable cursor, mapping
// pointer drags and arrow nudges to gamut-clamped values via the pure geometry
// helpers. Canvas drawing stays out of here — only an engine blit touches it.

import {
  useRef,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from "react";

import { max_in_gamut_chroma } from "harmoni-wasm";

import { pointerEventToAxes, axesToPoint, nudgeAxes } from "./geometry";
import type { Gamut, OklchValue } from "./types";

/** One plotted axis of a plane chart: which channel it maps and how it steps. */
export type PlaneAxisSpec = {
  /** The OkLCH channel this axis plots. */
  channel: keyof OklchValue;
  /** Human-readable axis name for the accessible label, e.g. `"Lightness"`. */
  name: string;
  /** The axis value at the far (right / top) edge. */
  max: number;
  /** Fine arrow-key step. */
  step: number;
  /** Coarse (Shift) arrow-key step. */
  coarseStep: number;
  /** Decimal places for the announced value. */
  precision: number;
};

/** A gamut-boundary polyline to overlay (the Hue chart's sRGB / P3 curves). */
export type BoundaryLine = { className: string; points: string };

export type PlaneChartProps = {
  value: OklchValue;
  gamut: Gamut;
  /** The two plotted axes; the remaining channel is held fixed. */
  axes: { x: PlaneAxisSpec; y: PlaneAxisSpec };
  onChange: (next: OklchValue) => void;
  planeRef: RefObject<HTMLCanvasElement | null>;
  width: number;
  height: number;
  /** Optional gamut-boundary polylines (only the Hue chart draws a clean one). */
  boundaries?: BoundaryLine[];
};

export function PlaneChart({
  value,
  gamut,
  axes,
  onChange,
  planeRef,
  width,
  height,
  boundaries,
}: PlaneChartProps) {
  const dragging = useRef(false);
  const { x: xAxis, y: yAxis } = axes;
  // Chroma is the only channel the engine clamps to the gamut on interaction; a
  // chart that plots it clamps, one that holds it fixed leaves it (so its cursor
  // can sit beyond the boundary, showing the colour is unreachable).
  const clampsChroma = xAxis.channel === "c" || yAxis.channel === "c";

  // Merge the dragged/nudged axis values back into the full colour, clamping
  // chroma to the engine's in-gamut boundary for the active gamut when chroma is
  // one of the plotted axes (Principle 1).
  const emitAxes = (x: number, y: number) => {
    const next = { ...value, [xAxis.channel]: x, [yAxis.channel]: y };
    if (clampsChroma) {
      next.c = Math.min(next.c, max_in_gamut_chroma(next.l, next.h, gamut));
    }
    onChange(next);
  };

  const emit = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const { x, y } = pointerEventToAxes(
      event.clientX,
      event.clientY,
      rect,
      xAxis.max,
      yAxis.max,
    );
    emitAxes(x, y);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = nudgeAxes(
      value[xAxis.channel],
      value[yAxis.channel],
      event.key,
      event.shiftKey,
      {
        x: { fine: xAxis.step, coarse: xAxis.coarseStep },
        y: { fine: yAxis.step, coarse: yAxis.coarseStep },
      },
      xAxis.max,
      yAxis.max,
    );
    if (!next) return;
    event.preventDefault();
    emitAxes(next.x, next.y);
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

  const xVal = value[xAxis.channel];
  const yVal = value[yAxis.channel];
  const cursor = axesToPoint(xVal, yVal, width, height, xAxis.max, yAxis.max);

  return (
    <div
      className="plane-chart"
      role="group"
      tabIndex={0}
      aria-label={`${xAxis.name} and ${yAxis.name}. ${xAxis.name} ${xVal.toFixed(
        xAxis.precision,
      )}, ${yAxis.name} ${yVal.toFixed(
        yAxis.precision,
      )}. Arrow keys adjust, hold Shift for larger steps.`}
      style={{ width, height }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
    >
      <canvas
        ref={planeRef}
        className="plane-chart__plane"
        width={width}
        height={height}
      />
      <svg
        className="plane-chart__overlay"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {boundaries?.map((boundary) => (
          <polyline
            key={boundary.className}
            className={boundary.className}
            points={boundary.points}
          />
        ))}
        {/* Shared guide lines: the vertical line marks the x axis's current
            value, the horizontal line the y axis's — so charts that share an
            axis line up (the oklch.com net). */}
        <line
          className="plane-chart__guide"
          x1={cursor.x}
          y1={0}
          x2={cursor.x}
          y2={height}
        />
        <line
          className="plane-chart__guide"
          x1={0}
          y1={cursor.y}
          x2={width}
          y2={cursor.y}
        />
      </svg>
      <div
        className="plane-chart__cursor"
        aria-hidden="true"
        style={{ left: cursor.x, top: cursor.y }}
      />
    </div>
  );
}
