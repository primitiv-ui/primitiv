import { describe, expect, it } from "vitest";

import { contrast } from "./contrast";

describe("contrast", () => {
  it("is 21:1 for black on white, either way round", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21);
    expect(contrast("#ffffff", "#000000")).toBeCloseTo(21);
  });

  it("is 1:1 for a colour on itself", () => {
    expect(contrast("#236ce1", "#236ce1")).toBe(1);
  });

  it("matches the WCAG ratio for the brand 500 / white pairing", () => {
    expect(contrast("#236ce1", "#ffffff")).toBeCloseTo(4.88, 2);
  });
});
