// Blits a flat RGBA buffer from the engine's `paint_*` functions straight onto
// a canvas via `ImageData`/`putImageData` (RFC 0010 §1, Principle 2 — the wasm
// boundary is crossed once per chart, not per pixel). Guards a missing canvas
// (ref not yet attached) and a missing 2D context so callers stay branch-free.
//
// The context is always requested in `display-p3` (a superset of sRGB): the
// ImageData is tagged with the buffer's own colour space, so an sRGB buffer
// displays unchanged while a Display-P3 buffer keeps its wide-gamut colours
// instead of being clamped to sRGB on `putImageData` (RFC 0010 §7).

/**
 * Draws `buffer` (RGBA, `width * height * 4` bytes) onto `canvas` at (0, 0),
 * interpreting the bytes in `colorSpace` (the gamut the buffer was painted in).
 */
export function blitBuffer(
  canvas: HTMLCanvasElement | null,
  buffer: Uint8Array,
  width: number,
  height: number,
  colorSpace: PredefinedColorSpace = "srgb",
): void {
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { colorSpace: "display-p3" });
  if (!ctx) return;
  const image = new ImageData(new Uint8ClampedArray(buffer), width, height, {
    colorSpace,
  });
  ctx.putImageData(image, 0, 0);
}
