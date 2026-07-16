import {
  shortestStep,
  snapTarget,
  flingTarget,
  normalizeOffset,
  wrapShift,
} from "../loopEngine.ts";

// Pure positioning math for the infinite transform loop (RFC 0018). No DOM —
// these are the deterministic heart the interaction layer composes: which way to
// wrap, where a drag settles, where a fling lands, and how to keep the track
// offset bounded for seamless repositioning.

describe("loopEngine.shortestStep", () => {
  it("steps forward by one when the target is the next slide", () => {
    expect(shortestStep(0, 1, 4)).toBe(1);
  });

  it("wraps forward the short way from the last slide to the first", () => {
    // 3 → 0 around a ring of 4 is +1 forward, not −3 back (the rewind).
    expect(shortestStep(3, 0, 4)).toBe(1);
  });

  it("wraps backward the short way from the first slide to the last", () => {
    expect(shortestStep(0, 3, 4)).toBe(-1);
  });

  it("resolves an exact half-way tie forward", () => {
    // 0 → 2 of 4 is equidistant either way; ties go forward (positive).
    expect(shortestStep(0, 2, 4)).toBe(2);
  });

  it("takes the backward route when it is strictly shorter", () => {
    // 0 → 3 of 5: forward 3 vs backward 2 → backward.
    expect(shortestStep(0, 3, 5)).toBe(-2);
  });

  it("is a no-op for a non-positive count", () => {
    expect(shortestStep(0, 1, 0)).toBe(0);
  });
});

describe("loopEngine.snapTarget", () => {
  it("rounds a continuous offset to the nearest slide boundary", () => {
    expect(snapTarget(230, 100)).toBe(200);
    expect(snapTarget(260, 100)).toBe(300);
  });

  it("returns 0 for a non-positive stride", () => {
    expect(snapTarget(260, 0)).toBe(0);
  });
});

describe("loopEngine.flingTarget", () => {
  it("carries the offset by velocity × deceleration, then snaps to a boundary", () => {
    // offset 100 + (2 px/ms × 60 ms) = 220 → nearest 100-boundary = 200.
    expect(flingTarget(100, 2, 60, 100)).toBe(200);
  });

  it("projects backward for a negative velocity", () => {
    // 300 + (−2 × 60) = 180 → nearest boundary 200.
    expect(flingTarget(300, -2, 60, 100)).toBe(200);
  });
});

describe("loopEngine.normalizeOffset", () => {
  it("wraps an over-long offset back into [0, trackLength)", () => {
    expect(normalizeOffset(450, 400)).toBe(50);
  });

  it("wraps a negative offset up into range", () => {
    expect(normalizeOffset(-50, 400)).toBe(350);
  });

  it("returns 0 for a non-positive track length", () => {
    expect(normalizeOffset(450, 0)).toBe(0);
  });
});

describe("loopEngine.wrapShift", () => {
  // A slide's flex position is `baseLeft`; the track is translated by `-p`, so
  // the slide's raw on-screen position is `baseLeft - p`. wrapShift returns the
  // whole-track-length nudge (a multiple of trackLength) that moves the slide's
  // *nearest copy* into view — the seamless-loop fill that replaces clones.
  it("is zero when the slide is already the nearest copy", () => {
    expect(wrapShift(0, 0, 400)).toBe(0);
    expect(wrapShift(100, 120, 400)).toBe(0);
  });

  it("pulls a slide that has scrolled far off the start round to the end", () => {
    // baseLeft 0, p 350 → on-screen −350; the copy at +50 (shift +400) is nearer.
    expect(wrapShift(0, 350, 400)).toBe(400);
  });

  it("pushes a slide that is far ahead round to the start", () => {
    // baseLeft 300, p −150 → on-screen 450; the copy at 50 (shift −400) is nearer.
    expect(wrapShift(300, -150, 400)).toBe(-400);
  });

  it("returns 0 for a non-positive track length", () => {
    expect(wrapShift(300, -150, 0)).toBe(0);
  });
});
