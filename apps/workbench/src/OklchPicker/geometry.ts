// Pure pixel↔value geometry for the L×C pad (RFC 0010 §5). The canvas paints
// lightness 0..1 left→right and chroma c_max..0 top→bottom (matching the
// `paint_lc_plane` buffer); these helpers map a pointer position to an OkLCH
// (l, c) and back to a cursor point, with clamping into range. No colour maths
// lives here — the gamut boundary is applied separately via the engine.

/** The chroma ceiling the L×C plane is painted and measured against. */
export const C_MAX = 0.4;

/** Fine arrow-key step for lightness (`0..1`) on the L×C pad. */
export const LIGHTNESS_STEP = 0.005;
/** Coarse (Shift) arrow-key step for lightness on the L×C pad. */
export const LIGHTNESS_COARSE_STEP = 0.05;
/** Fine arrow-key step for chroma (`0..c_max`) on the L×C pad. */
export const CHROMA_STEP = 0.002;
/** Coarse (Shift) arrow-key step for chroma on the L×C pad. */
export const CHROMA_COARSE_STEP = 0.02;

/** Clamps `value` into the inclusive `[min, max]` range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Maps a pointer offset within a `width`×`height` chart to an OkLCH `(l, c)`.
 * `x` runs lightness `0..1` left→right; `y` runs chroma `cMax..0` top→bottom.
 * Drags beyond the edges clamp into range.
 */
export function pointerToLc(
  x: number,
  y: number,
  width: number,
  height: number,
  cMax: number,
): { l: number; c: number } {
  const l = clamp(x / width, 0, 1);
  const c = clamp((1 - y / height) * cMax, 0, cMax);
  return { l, c };
}

/**
 * Maps a pointer event's client coordinates to an OkLCH `(l, c)` using the
 * chart element's bounding rect as the origin and extent.
 */
export function pointerEventToLc(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  cMax: number,
): { l: number; c: number } {
  return pointerToLc(
    clientX - rect.left,
    clientY - rect.top,
    rect.width,
    rect.height,
    cMax,
  );
}

/**
 * Nudges an OkLCH `(l, c)` for an arrow keypress on the L×C pad: `ArrowLeft` /
 * `ArrowRight` step lightness, `ArrowUp` / `ArrowDown` step chroma, `coarse`
 * (the Shift modifier) swaps the fine step for the coarse one. The result is
 * clamped into `[0, 1]` / `[0, cMax]`; the gamut clamp is applied separately by
 * the caller (the engine owns the boundary, Principle 1). Returns `null` for a
 * non-arrow key so the handler leaves other keys alone.
 */
export function nudgeLc(
  l: number,
  c: number,
  key: string,
  coarse: boolean,
  cMax: number,
): { l: number; c: number } | null {
  const lStep = coarse ? LIGHTNESS_COARSE_STEP : LIGHTNESS_STEP;
  const cStep = coarse ? CHROMA_COARSE_STEP : CHROMA_STEP;
  switch (key) {
    case "ArrowRight":
      return { l: clamp(l + lStep, 0, 1), c };
    case "ArrowLeft":
      return { l: clamp(l - lStep, 0, 1), c };
    case "ArrowUp":
      return { l, c: clamp(c + cStep, 0, cMax) };
    case "ArrowDown":
      return { l, c: clamp(c - cStep, 0, cMax) };
    default:
      return null;
  }
}

/**
 * The inverse of {@link pointerToLc}: the cursor point for an OkLCH `(l, c)`
 * within a `width`×`height` chart.
 */
export function lcToPoint(
  l: number,
  c: number,
  width: number,
  height: number,
  cMax: number,
): { x: number; y: number } {
  const x = l * width;
  const y = (1 - c / cMax) * height;
  return { x, y };
}
