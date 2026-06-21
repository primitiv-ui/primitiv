import { describe, it, expect } from "vitest";

import { repaintTargets } from "../repaint";
import type { OklchValue } from "../types";

const base: OklchValue = { l: 0.6, c: 0.15, h: 250 };

describe("repaintTargets", () => {
  it("repaints nothing when the value is unchanged", () => {
    expect(repaintTargets(base, base)).toEqual({ plane: false, strip: false });
  });

  it("repaints only the plane when the hue changes", () => {
    expect(repaintTargets(base, { ...base, h: 120 })).toEqual({
      plane: true,
      strip: false,
    });
  });

  it("repaints only the strip when the lightness changes", () => {
    expect(repaintTargets(base, { ...base, l: 0.3 })).toEqual({
      plane: false,
      strip: true,
    });
  });

  it("repaints only the strip when the chroma changes", () => {
    expect(repaintTargets(base, { ...base, c: 0.05 })).toEqual({
      plane: false,
      strip: true,
    });
  });

  it("repaints both when hue and lightness both change", () => {
    expect(repaintTargets(base, { l: 0.3, c: 0.15, h: 120 })).toEqual({
      plane: true,
      strip: true,
    });
  });

  it("treats a null previous value as a first paint of both charts", () => {
    expect(repaintTargets(null, base)).toEqual({ plane: true, strip: true });
  });
});
