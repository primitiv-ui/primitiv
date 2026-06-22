// Maps a chart's measured CSS size to its canvas backing-store size (RFC 0010 §5,
// the higher-resolution pass). A canvas painted at its CSS pixel size is blurry on
// HiDPI displays, where each CSS pixel covers several device pixels; painting at
// `size × devicePixelRatio` gives a pixel-crisp blit. The ratio is floored at 1 so
// the backing store never drops below the display, and the result is rounded to
// whole canvas pixels.

/** The backing-store dimensions for a `width`×`height` CSS chart at `dpr`. */
export function renderDimensions(
  width: number,
  height: number,
  dpr: number,
): { width: number; height: number } {
  const scale = Math.max(1, dpr);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}
