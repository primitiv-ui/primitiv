import { describe, it, expect } from "vitest";

import { renderDimensions } from "../resolution";

describe("renderDimensions", () => {
  it("scales the display size by the device pixel ratio for a crisp backing store", () => {
    expect(renderDimensions(300, 150, 2)).toEqual({ width: 600, height: 300 });
  });

  it("rounds fractional device pixels to whole canvas pixels", () => {
    expect(renderDimensions(301, 151, 1.5)).toEqual({ width: 452, height: 227 });
  });

  it("never paints below the display size when the ratio is under one", () => {
    expect(renderDimensions(300, 150, 0.5)).toEqual({ width: 300, height: 150 });
  });

  it("leaves an unmeasured (zero) size at zero", () => {
    expect(renderDimensions(0, 0, 2)).toEqual({ width: 0, height: 0 });
  });
});
