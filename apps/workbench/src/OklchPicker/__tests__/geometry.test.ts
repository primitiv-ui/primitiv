import { describe, it, expect } from "vitest";

import {
  clamp,
  pointerToLc,
  lcToPoint,
  pointerEventToLc,
  C_MAX,
} from "../geometry";

describe("clamp", () => {
  it("returns the value when inside the range", () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });

  it("clamps to the lower bound", () => {
    expect(clamp(-0.3, 0, 1)).toBe(0);
  });

  it("clamps to the upper bound", () => {
    expect(clamp(1.4, 0, 1)).toBe(1);
  });
});

describe("pointerToLc", () => {
  it("maps the left edge to lightness 0 and the bottom edge to chroma 0", () => {
    const { l, c } = pointerToLc(0, 200, 100, 200, C_MAX);

    expect(l).toBe(0);
    expect(c).toBe(0);
  });

  it("maps the right edge to lightness 1 and the top edge to chroma c_max", () => {
    const { l, c } = pointerToLc(100, 0, 100, 200, C_MAX);

    expect(l).toBe(1);
    expect(c).toBeCloseTo(C_MAX);
  });

  it("maps the centre to mid lightness and half chroma", () => {
    const { l, c } = pointerToLc(50, 100, 100, 200, C_MAX);

    expect(l).toBeCloseTo(0.5);
    expect(c).toBeCloseTo(C_MAX / 2);
  });

  it("clamps a pointer dragged past the left/below the bottom into range", () => {
    const { l, c } = pointerToLc(-40, 320, 100, 200, C_MAX);

    expect(l).toBe(0);
    expect(c).toBe(0);
  });

  it("clamps a pointer dragged past the right/above the top into range", () => {
    const { l, c } = pointerToLc(160, -50, 100, 200, C_MAX);

    expect(l).toBe(1);
    expect(c).toBeCloseTo(C_MAX);
  });
});

describe("lcToPoint", () => {
  it("is the inverse of pointerToLc at an interior point", () => {
    const { x, y } = lcToPoint(0.5, C_MAX / 2, 100, 200, C_MAX);

    expect(x).toBeCloseTo(50);
    expect(y).toBeCloseTo(100);
  });

  it("places lightness 1 at the right edge and chroma c_max at the top", () => {
    const { x, y } = lcToPoint(1, C_MAX, 100, 200, C_MAX);

    expect(x).toBeCloseTo(100);
    expect(y).toBeCloseTo(0);
  });
});

describe("pointerEventToLc", () => {
  it("subtracts the chart's origin before mapping client coordinates", () => {
    const rect = { left: 30, top: 50, width: 100, height: 200 };

    const { l, c } = pointerEventToLc(80, 150, rect, C_MAX);

    expect(l).toBeCloseTo(0.5);
    expect(c).toBeCloseTo(C_MAX / 2);
  });
});
