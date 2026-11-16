import {
  carouselFlingTarget,
  carouselLoopAlign,
  carouselLoopIndex,
  carouselLoopPainted,
  carouselNormalizeOffset,
  carouselShortestStep,
  carouselSnapTarget,
} from "../loop";

// The infinite loop's positioning maths (RFC 0018): which way to wrap, where a
// drag settles, where a fling lands, how to keep the track offset bounded for a
// seamless re-base, and the geometry the transform engine paints against.

describe("carouselShortestStep", () => {
  it("steps forward by one when the target is the next slide", () => {
    // Arrange & Act & Assert
    expect(carouselShortestStep(0, 1, 4)).toBe(1);
  });

  it("wraps forward the short way from the last slide to the first", () => {
    // Arrange & Act & Assert — 3 → 0 around a ring of 4 is +1 forward, not −3 back.
    expect(carouselShortestStep(3, 0, 4)).toBe(1);
  });

  it("wraps backward the short way from the first slide to the last", () => {
    // Arrange & Act & Assert
    expect(carouselShortestStep(0, 3, 4)).toBe(-1);
  });

  it("resolves an exact half-way tie forward", () => {
    // Arrange & Act & Assert
    expect(carouselShortestStep(0, 2, 4)).toBe(2);
  });

  it("takes the backward route when it is strictly shorter", () => {
    // Arrange & Act & Assert — 0 → 3 of 5: forward 3 vs backward 2.
    expect(carouselShortestStep(0, 3, 5)).toBe(-2);
  });

  it("is a no-op for a non-positive count", () => {
    // Arrange & Act & Assert
    expect(carouselShortestStep(0, 1, 0)).toBe(0);
  });
});

describe("carouselSnapTarget", () => {
  it("rounds a continuous offset to the nearest slide boundary", () => {
    // Arrange & Act & Assert
    expect(carouselSnapTarget(230, 100)).toBe(200);
    expect(carouselSnapTarget(260, 100)).toBe(300);
  });

  it("returns 0 for a non-positive stride", () => {
    // Arrange & Act & Assert
    expect(carouselSnapTarget(260, 0)).toBe(0);
  });
});

describe("carouselFlingTarget", () => {
  it("carries the offset by velocity × deceleration, then snaps to a boundary", () => {
    // Arrange & Act & Assert — 100 + 2 × 60 = 220 → 200.
    expect(carouselFlingTarget(100, 2, 60, 100)).toBe(200);
  });

  it("projects backward for a negative velocity", () => {
    // Arrange & Act & Assert — 300 − 2 × 60 = 180 → 200.
    expect(carouselFlingTarget(300, -2, 60, 100)).toBe(200);
  });
});

describe("carouselNormalizeOffset", () => {
  it("wraps an over-long offset back into [0, trackLength)", () => {
    // Arrange & Act & Assert
    expect(carouselNormalizeOffset(450, 400)).toBe(50);
  });

  it("wraps a negative offset up into range", () => {
    // Arrange & Act & Assert
    expect(carouselNormalizeOffset(-50, 400)).toBe(350);
  });

  it("returns 0 for a non-positive track length", () => {
    // Arrange & Act & Assert
    expect(carouselNormalizeOffset(450, 0)).toBe(0);
  });
});

describe("carouselLoopIndex", () => {
  it("is the real slide an offset rests on, wrapped into the ring", () => {
    // Arrange & Act & Assert
    expect(carouselLoopIndex(200, 100, 4)).toBe(2);
    expect(carouselLoopIndex(440, 100, 4)).toBe(0);
    expect(carouselLoopIndex(-100, 100, 4)).toBe(3);
  });
});

describe("carouselLoopAlign", () => {
  it("rests a page flush with the track's start edge", () => {
    // Arrange & Act & Assert
    expect(carouselLoopAlign("start", 1, 500, 300)).toBe(0);
  });

  it("centres a page in the track", () => {
    // Arrange & Act & Assert
    expect(carouselLoopAlign("center", 1, 500, 300)).toBe(100);
    expect(carouselLoopAlign("center", -1, 500, 300)).toBe(100);
  });

  it("rests a page flush with the track's end edge", () => {
    // Arrange & Act & Assert
    expect(carouselLoopAlign("end", 1, 500, 300)).toBe(200);
  });

  it("swaps start and end when the axis runs backwards (RTL)", () => {
    // Arrange & Act & Assert
    expect(carouselLoopAlign("start", -1, 500, 300)).toBe(200);
    expect(carouselLoopAlign("end", -1, 500, 300)).toBe(0);
  });
});

describe("carouselLoopPainted", () => {
  // A 500 px track: a slide stays painted while any part of it is within one
  // track's slack of the viewport, anywhere along the sweep from → to.
  const track = 500;

  it("paints a slide resting on screen", () => {
    // Arrange & Act & Assert
    expect(carouselLoopPainted({ edge: 0, size: 500, from: 0, to: 0, dir: 1, trackSize: track })).toBe(true);
  });

  it("paints a slide within a track's slack either side", () => {
    // Arrange & Act & Assert — 1000 is exactly the far edge plus the slack.
    expect(carouselLoopPainted({ edge: 1000, size: 100, from: 0, to: 0, dir: 1, trackSize: track })).toBe(true);
    expect(carouselLoopPainted({ edge: -600, size: 100, from: 0, to: 0, dir: 1, trackSize: track })).toBe(true);
  });

  it("hides a slide further away than the slack", () => {
    // Arrange & Act & Assert
    expect(carouselLoopPainted({ edge: 1001, size: 100, from: 0, to: 0, dir: 1, trackSize: track })).toBe(false);
    expect(carouselLoopPainted({ edge: -601, size: 100, from: 0, to: 0, dir: 1, trackSize: track })).toBe(false);
  });

  it("keeps a slide painted that the sweep passes over, though it ends off screen", () => {
    // Arrange & Act & Assert — at rest (from 0) it is on screen; at the target it is far right.
    expect(carouselLoopPainted({ edge: 200, size: 100, from: 0, to: -2000, dir: 1, trackSize: track })).toBe(true);
    // And one the sweep arrives at, from far away.
    expect(carouselLoopPainted({ edge: 2200, size: 100, from: 0, to: 2000, dir: 1, trackSize: track })).toBe(true);
  });

  it("keeps a slide painted that the sweep leaves from, though it ends off screen", () => {
    // Arrange & Act & Assert — on screen at the sweep's start (offset 1000), far right at its end.
    expect(carouselLoopPainted({ edge: 1500, size: 100, from: 1000, to: -500, dir: 1, trackSize: track })).toBe(true);
  });

  it("mirrors the sweep under a backwards axis", () => {
    // Arrange & Act & Assert — the same offset moves the slide the other way.
    expect(carouselLoopPainted({ edge: 2200, size: 100, from: 0, to: 2000, dir: -1, trackSize: track })).toBe(false);
    expect(carouselLoopPainted({ edge: -1800, size: 100, from: 0, to: 2000, dir: -1, trackSize: track })).toBe(true);
  });
});
