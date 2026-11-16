// The infinite loop's positioning maths (RFC 0018, clone-strip revision). No
// DOM: the transform engine composes these to drive a translated track — which
// way to step to a page the short way, where a drag or a fling settles, how to
// bound the continuous offset into one period so the clone strip re-bases
// seamlessly at the seam, and which slides it keeps painted.

import type { CarouselSnapAlign } from "./policy.ts";

/** How far a fling carries past the release: released velocity (px/ms) × this (ms). */
export const CAROUSEL_FLING_DECEL_MS = 120;

/**
 * Signed number of steps from slide `from` to slide `to` around a ring of
 * `count` slides, taking the **short way** — so wrapping past the end advances
 * one step forward rather than rewinding the whole track. An exact half-way tie
 * resolves forward (positive). A non-positive `count` is a no-op (0).
 */
export function carouselShortestStep(from: number, to: number, count: number): number {
  if (count <= 0) return 0;
  const forward = (((to - from) % count) + count) % count;
  return forward * 2 > count ? forward - count : forward;
}

/** The nearest slide boundary to a continuous `offset`; a non-positive `stride` gives 0. */
export function carouselSnapTarget(offset: number, stride: number): number {
  if (stride <= 0) return 0;
  return Math.round(offset / stride) * stride;
}

/**
 * Where a fling rests: `offset` carried by `velocity` (px/ms) over a `decel`
 * time-scale (ms; larger travels further), then snapped to a boundary. A
 * deliberately simple, deterministic momentum model.
 */
export function carouselFlingTarget(offset: number, velocity: number, decel: number, stride: number): number {
  return carouselSnapTarget(offset + velocity * decel, stride);
}

/** `offset` wrapped into `[0, trackLength)`; a non-positive `trackLength` gives 0. */
export function carouselNormalizeOffset(offset: number, trackLength: number): number {
  if (trackLength <= 0) return 0;
  return ((offset % trackLength) + trackLength) % trackLength;
}

/** The real slide an `offset` rests on, wrapped into a ring of `count` slides of `stride`. */
export function carouselLoopIndex(offset: number, stride: number, count: number): number {
  return ((Math.round(offset / stride) % count) + count) % count;
}

/**
 * Where a page of `pageSpan` rests in a track of `trackSize`, from its start
 * edge, for its snap alignment. Under a backwards axis (`dir` −1, RTL) the
 * reading start is the far edge, so start and end swap; centre is symmetric.
 */
export function carouselLoopAlign(snapAlign: CarouselSnapAlign, dir: number, trackSize: number, pageSpan: number): number {
  if (snapAlign === "center") return (trackSize - pageSpan) / 2;
  const atEnd = (snapAlign === "end") !== (dir === -1);
  return atEnd ? trackSize - pageSpan : 0;
}

/** A slide's place in the track, for {@link carouselLoopPainted}. */
export type CarouselLoopPaintState = {
  /** The slide's leading edge from the viewport's start, at offset 0. */
  edge: number;
  /** The slide's size along the axis. */
  size: number;
  /** The offset the track sweeps from. */
  from: number;
  /** The offset the track sweeps to. */
  to: number;
  /** +1 for a forward axis, −1 for a backwards one (RTL). */
  dir: number;
  /** One viewport along the axis — also the slack either side. */
  trackSize: number;
};

/**
 * Whether a slide stays painted: on screen, or within a viewport's slack of it,
 * anywhere along the sweep `from` → `to`, so a slide entering is painted before
 * it arrives and one leaving stays painted until it has gone. Everything else
 * is hidden, keeping the composited strip about one screen wide.
 */
export function carouselLoopPainted({ edge, size, from, to, dir, trackSize }: CarouselLoopPaintState): boolean {
  const a = edge - dir * from;
  const b = edge - dir * to;
  return Math.max(a, b) + size >= -trackSize && Math.min(a, b) <= trackSize * 2;
}
