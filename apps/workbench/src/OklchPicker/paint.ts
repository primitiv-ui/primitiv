// Blits a flat RGBA buffer from the engine's `paint_*` functions straight onto
// a canvas via `ImageData`/`putImageData` (RFC 0010 §1, Principle 2 — the wasm
// boundary is crossed once per chart, not per pixel). Guards a missing canvas
// (ref not yet attached) and a missing 2D context so callers stay branch-free.

/** Draws `buffer` (RGBA, `width * height * 4` bytes) onto `canvas` at (0, 0). */
export function blitBuffer(
  canvas: HTMLCanvasElement | null,
  buffer: Uint8Array,
  width: number,
  height: number,
): void {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const image = new ImageData(new Uint8ClampedArray(buffer), width, height);
  ctx.putImageData(image, 0, 0);
}
