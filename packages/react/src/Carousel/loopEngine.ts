// Pure positioning math for the infinite-loop transform engine (RFC 0018). No
// DOM, no React — the interaction layer composes these to drive a translated
// track: which way to wrap a page step, where a drag/fling settles, and how to
// keep the continuous offset bounded so slides can reposition seamlessly at the
// seam. Kept pure so the tricky logic is exhaustively unit-testable without a
// browser (the thing that made the scroll-snap version un-iterable).

/**
 * Signed number of steps from slide `from` to slide `to` around a ring of
 * `count` slides, taking the **short way** — so wrapping past the end advances
 * one step forward rather than rewinding the whole track. An exact half-way tie
 * resolves forward (positive). Non-positive `count` is a no-op (0).
 */
export function shortestStep(from: number, to: number, count: number): number {
  if (count <= 0) return 0;
  const forward = (((to - from) % count) + count) % count; // 0 … count-1
  return forward * 2 > count ? forward - count : forward;
}

/**
 * The offset of the nearest slide boundary to a continuous `offset`, given the
 * per-slide `stride` (slide size + inter-slide gap). Non-positive `stride`
 * degrades to 0.
 */
export function snapTarget(offset: number, stride: number): number {
  if (stride <= 0) return 0;
  return Math.round(offset / stride) * stride;
}

/**
 * Resting offset of a fling: the current `offset` carried by `velocity`
 * (px/ms) over a `decel` time-scale (ms; larger travels further), then snapped
 * to the nearest boundary. A deliberately simple, deterministic momentum model
 * — the feel is tuned by `decel`, in JS, rather than left to the OS.
 */
export function flingTarget(
  offset: number,
  velocity: number,
  decel: number,
  stride: number,
): number {
  return snapTarget(offset + velocity * decel, stride);
}

/**
 * Wrap a continuous `offset` into `[0, trackLength)` — the modular position the
 * track is translated to, and the basis for per-slide seam repositioning.
 * Non-positive `trackLength` degrades to 0.
 */
export function normalizeOffset(offset: number, trackLength: number): number {
  if (trackLength <= 0) return 0;
  return ((offset % trackLength) + trackLength) % trackLength;
}

/** Clamp to the unit interval. */
function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/**
 * Cubic ease-out — moves off fast and settles gently, the standard feel for a
 * programmatic carousel glide. Input is clamped to `[0, 1]`.
 */
export function easeOut(t: number): number {
  const c = clamp01(t);
  return 1 - (1 - c) ** 3;
}

/**
 * Eased value of a tween from `start` to `end` at `elapsed` of `duration` ms.
 * Returns `start` at elapsed 0 and `end` once elapsed reaches the duration; a
 * non-positive `duration` jumps straight to `end` (used for reduced motion).
 */
export function tweenValue(
  start: number,
  end: number,
  elapsed: number,
  duration: number,
): number {
  if (duration <= 0) return end;
  const progress = easeOut(elapsed / duration);
  return start + (end - start) * progress;
}
