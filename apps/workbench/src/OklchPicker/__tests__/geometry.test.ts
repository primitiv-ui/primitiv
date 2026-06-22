import { describe, it, expect } from "vitest";

import {
  clamp,
  pointToAxes,
  axesToPoint,
  pointerEventToAxes,
  nudgeAxes,
} from "../geometry";

// Shared step config for the generic-axis tests: x stepped by 0.1/0.2, y by 1/5.
const STEPS = { x: { fine: 0.1, coarse: 0.2 }, y: { fine: 1, coarse: 5 } };

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

describe("pointToAxes", () => {
  it("maps the left edge to x 0 and the bottom edge to y 0", () => {
    const { x, y } = pointToAxes(0, 200, 100, 200, 360, 1);

    expect(x).toBe(0);
    expect(y).toBe(0);
  });

  it("maps the right edge to xMax and the top edge to yMax", () => {
    const { x, y } = pointToAxes(100, 0, 100, 200, 360, 1);

    expect(x).toBeCloseTo(360);
    expect(y).toBeCloseTo(1);
  });

  it("clamps a pointer dragged outside the chart into range", () => {
    const below = pointToAxes(-40, 320, 100, 200, 360, 1);
    expect(below).toEqual({ x: 0, y: 0 });

    const above = pointToAxes(160, -50, 100, 200, 360, 1);
    expect(above.x).toBeCloseTo(360);
    expect(above.y).toBeCloseTo(1);
  });
});

describe("axesToPoint", () => {
  it("is the inverse of pointToAxes at an interior point", () => {
    const { x, y } = axesToPoint(180, 0.5, 100, 200, 360, 1);

    expect(x).toBeCloseTo(50);
    expect(y).toBeCloseTo(100);
  });

  it("places xMax at the right edge and yMax at the top", () => {
    const { x, y } = axesToPoint(360, 1, 100, 200, 360, 1);

    expect(x).toBeCloseTo(100);
    expect(y).toBeCloseTo(0);
  });
});

describe("pointerEventToAxes", () => {
  it("subtracts the chart's origin before mapping client coordinates", () => {
    const rect = { left: 30, top: 50, width: 100, height: 200 };

    const { x, y } = pointerEventToAxes(80, 150, rect, 360, 1);

    expect(x).toBeCloseTo(180);
    expect(y).toBeCloseTo(0.5);
  });
});

describe("nudgeAxes", () => {
  it("steps x up on ArrowRight, leaving y untouched", () => {
    expect(nudgeAxes(100, 0.5, "ArrowRight", false, STEPS, 360, 1)).toEqual({
      x: 100.1,
      y: 0.5,
    });
  });

  it("steps x down on ArrowLeft", () => {
    expect(nudgeAxes(100, 0.5, "ArrowLeft", false, STEPS, 360, 1)).toEqual({
      x: 99.9,
      y: 0.5,
    });
  });

  it("steps y up on ArrowUp and down on ArrowDown", () => {
    expect(nudgeAxes(100, 0.5, "ArrowUp", false, STEPS, 360, 360)).toEqual({
      x: 100,
      y: 1.5,
    });
    expect(nudgeAxes(100, 5, "ArrowDown", false, STEPS, 360, 360)).toEqual({
      x: 100,
      y: 4,
    });
  });

  it("uses the coarse step when shift is held", () => {
    expect(nudgeAxes(100, 0.5, "ArrowRight", true, STEPS, 360, 360)).toEqual({
      x: 100.2,
      y: 0.5,
    });
    expect(nudgeAxes(100, 0.5, "ArrowUp", true, STEPS, 360, 360)).toEqual({
      x: 100,
      y: 5.5,
    });
  });

  it("clamps x into [0, xMax] and y into [0, yMax] at the edges", () => {
    expect(nudgeAxes(360, 0.5, "ArrowRight", false, STEPS, 360, 1)).toEqual({
      x: 360,
      y: 0.5,
    });
    expect(nudgeAxes(100, 1, "ArrowUp", false, STEPS, 360, 1)).toEqual({
      x: 100,
      y: 1,
    });
    expect(nudgeAxes(100, 0, "ArrowDown", false, STEPS, 360, 1)).toEqual({
      x: 100,
      y: 0,
    });
  });

  it("returns null for a key that is not an arrow", () => {
    expect(nudgeAxes(100, 0.5, "Enter", false, STEPS, 360, 1)).toBeNull();
  });
});
