// Pure pixel↔value geometry for the L×C pad (RFC 0010 §5). The canvas paints
// lightness 0..1 left→right and chroma c_max..0 top→bottom (matching the
// `paint_lc_plane` buffer); these helpers map a pointer position to an OkLCH
// (l, c) and back to a cursor point, with clamping into range. No colour maths
// lives here — the gamut boundary is applied separately via the engine.

/** The chroma ceiling the L×C plane is painted and measured against. */
export const C_MAX = 0.4;

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
