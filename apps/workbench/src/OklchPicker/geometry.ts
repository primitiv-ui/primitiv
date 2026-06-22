// Pure pixel↔value geometry for the picker's plane charts (RFC 0010 §5). A plane
// chart plots two OkLCH axes: the x value runs `0..xMax` left→right and the y
// value runs `0..yMax` bottom→top (so the larger value sits at the top, matching
// the engine painters). These helpers map a pointer position to a `(x, y)` axis
// pair and back to a cursor point, with clamping into range. No colour maths
// lives here — the gamut boundary is applied separately via the engine.

/** The chroma ceiling the chroma axis is painted and measured against. */
export const C_MAX = 0.4;

/** Fine arrow-key step for lightness (`0..1`) on a plane chart. */
export const LIGHTNESS_STEP = 0.005;
/** Coarse (Shift) arrow-key step for lightness on a plane chart. */
export const LIGHTNESS_COARSE_STEP = 0.05;
/** Fine arrow-key step for chroma (`0..c_max`) on a plane chart. */
export const CHROMA_STEP = 0.002;
/** Coarse (Shift) arrow-key step for chroma on a plane chart. */
export const CHROMA_COARSE_STEP = 0.02;

/** Clamps `value` into the inclusive `[min, max]` range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Maps a pointer offset within a `width`×`height` chart to a plane `(x, y)` axis
 * pair. `x` runs `0..xMax` left→right; `y` runs `0..yMax` bottom→top. Drags
 * beyond the edges clamp into range.
 */
export function pointToAxes(
  px: number,
  py: number,
  width: number,
  height: number,
  xMax: number,
  yMax: number,
): { x: number; y: number } {
  const x = clamp(px / width, 0, 1) * xMax;
  const y = clamp(1 - py / height, 0, 1) * yMax;
  return { x, y };
}

/**
 * Maps a pointer event's client coordinates to a plane `(x, y)` axis pair using
 * the chart element's bounding rect as the origin and extent.
 */
export function pointerEventToAxes(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  xMax: number,
  yMax: number,
): { x: number; y: number } {
  return pointToAxes(
    clientX - rect.left,
    clientY - rect.top,
    rect.width,
    rect.height,
    xMax,
    yMax,
  );
}

/** Fine and coarse arrow-key steps for a plane chart's two plotted axes. */
export type AxisSteps = {
  x: { fine: number; coarse: number };
  y: { fine: number; coarse: number };
};

/**
 * Nudges a plane `(x, y)` axis pair for an arrow keypress: `ArrowLeft` /
 * `ArrowRight` step `x`, `ArrowUp` / `ArrowDown` step `y`, `coarse` (the Shift
 * modifier) swaps each axis's fine step for its coarse one. The result is
 * clamped into `[0, xMax]` / `[0, yMax]`; any gamut clamp is applied separately
 * by the caller (the engine owns the boundary, Principle 1). Returns `null` for
 * a non-arrow key so the handler leaves other keys alone.
 */
export function nudgeAxes(
  x: number,
  y: number,
  key: string,
  coarse: boolean,
  steps: AxisSteps,
  xMax: number,
  yMax: number,
): { x: number; y: number } | null {
  const xStep = coarse ? steps.x.coarse : steps.x.fine;
  const yStep = coarse ? steps.y.coarse : steps.y.fine;
  switch (key) {
    case "ArrowRight":
      return { x: clamp(x + xStep, 0, xMax), y };
    case "ArrowLeft":
      return { x: clamp(x - xStep, 0, xMax), y };
    case "ArrowUp":
      return { x, y: clamp(y + yStep, 0, yMax) };
    case "ArrowDown":
      return { x, y: clamp(y - yStep, 0, yMax) };
    default:
      return null;
  }
}

/**
 * The inverse of {@link pointToAxes}: the cursor point for a plane `(x, y)` axis
 * pair within a `width`×`height` chart.
 */
export function axesToPoint(
  x: number,
  y: number,
  width: number,
  height: number,
  xMax: number,
  yMax: number,
): { x: number; y: number } {
  return { x: (x / xMax) * width, y: (1 - y / yMax) * height };
}
