import { describe, it, expect } from "vitest";

import { repaintTargets } from "../repaint";
import type { OklchValue } from "../types";

const value: OklchValue = { l: 0.6, c: 0.15, h: 250 };
const base = { value, gamut: "Srgb" as const };

describe("repaintTargets", () => {
  it("repaints nothing when neither the value nor the gamut changes", () => {
    expect(repaintTargets(base, base)).toEqual({
      plane: false,
      hueStrip: false,
      lightnessStrip: false,
      chromaStrip: false,
    });
  });

  it("repaints the plane and the L/C strips (not the hue strip) when the hue changes", () => {
    expect(
      repaintTargets(base, { ...base, value: { ...value, h: 120 } }),
    ).toEqual({
      plane: true,
      hueStrip: false,
      lightnessStrip: true,
      chromaStrip: true,
    });
  });

  it("repaints the hue and chroma strips (not the plane or L strip) when the lightness changes", () => {
    expect(
      repaintTargets(base, { ...base, value: { ...value, l: 0.3 } }),
    ).toEqual({
      plane: false,
      hueStrip: true,
      lightnessStrip: false,
      chromaStrip: true,
    });
  });

  it("repaints the hue and lightness strips (not the plane or C strip) when the chroma changes", () => {
    expect(
      repaintTargets(base, { ...base, value: { ...value, c: 0.05 } }),
    ).toEqual({
      plane: false,
      hueStrip: true,
      lightnessStrip: true,
      chromaStrip: false,
    });
  });

  it("repaints every chart when the gamut changes", () => {
    expect(repaintTargets(base, { ...base, gamut: "DisplayP3" })).toEqual({
      plane: true,
      hueStrip: true,
      lightnessStrip: true,
      chromaStrip: true,
    });
  });

  it("treats a null previous state as a first paint of every chart", () => {
    expect(repaintTargets(null, base)).toEqual({
      plane: true,
      hueStrip: true,
      lightnessStrip: true,
      chromaStrip: true,
    });
  });
});
