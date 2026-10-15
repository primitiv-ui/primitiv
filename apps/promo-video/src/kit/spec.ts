import type { ComponentType } from "react";

/**
 * One video. `width` × `height` is the canvas in CSS pixels; the renderer
 * captures it at 2× (SCALE), so 540 × 675 becomes a 1080 × 1350 file.
 */
export type VideoSpec = {
  readonly width: number;
  readonly height: number;
  /** Seconds. */
  readonly duration: number;
  /** Renders the frame at time `t` (seconds) — and nothing else may move it. */
  readonly Video: ComponentType<{ t: number }>;
};
