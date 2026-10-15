import { describe, expect, it } from "vitest";

import { easeInOutCubic, easeOutBack, interpolate, progress, spring } from "./time";

describe("progress", () => {
  it("is 0 before the window, 1 after it, and linear inside", () => {
    expect(progress(0, 1, 3)).toBe(0);
    expect(progress(2, 1, 3)).toBe(0.5);
    expect(progress(9, 1, 3)).toBe(1);
  });

  it("jumps straight to 1 for a zero-length window", () => {
    expect(progress(1, 1, 1)).toBe(1);
  });
});

describe("interpolate", () => {
  it("maps the time window onto the value range, clamped", () => {
    expect(interpolate(0, [1, 3], [10, 20])).toBe(10);
    expect(interpolate(2, [1, 3], [10, 20])).toBe(15);
    expect(interpolate(5, [1, 3], [10, 20])).toBe(20);
  });

  it("shapes the progress through the easing", () => {
    expect(interpolate(2, [1, 3], [0, 100], (p) => p * p)).toBe(25);
  });
});

describe("easings", () => {
  it("easeInOutCubic is symmetric about the midpoint", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.25)).toBeCloseTo(1 - easeInOutCubic(0.75));
  });

  it("easeOutBack overshoots before settling on 1", () => {
    expect(Math.max(...[0.6, 0.7, 0.8].map(easeOutBack))).toBeGreaterThan(1);
    expect(easeOutBack(1)).toBeCloseTo(1);
  });
});

describe("spring", () => {
  it("starts at 0 and settles on 1", () => {
    expect(spring(0)).toBe(0);
    expect(spring(3)).toBeCloseTo(1, 3);
  });

  it("stays at 0 for negative time", () => {
    expect(spring(-1)).toBe(0);
  });

  it("overshoots when underdamped", () => {
    const samples = Array.from({ length: 100 }, (_, i) => spring(i / 50, { damping: 10 }));
    expect(Math.max(...samples)).toBeGreaterThan(1);
  });
});
