import { describe, it, expect } from "vitest";

import { CHANNELS, clampChannel, roundChannel } from "../channels";
import { C_MAX } from "../geometry";

describe("clampChannel", () => {
  it("clamps lightness into [0, 1]", () => {
    expect(clampChannel("l", 5)).toBe(1);
    expect(clampChannel("l", -0.2)).toBe(0);
    expect(clampChannel("l", 0.4)).toBe(0.4);
  });

  it("clamps chroma into [0, c_max]", () => {
    expect(clampChannel("c", 1)).toBe(C_MAX);
    expect(clampChannel("c", -0.1)).toBe(0);
  });

  it("clamps hue into [0, 360]", () => {
    expect(clampChannel("h", 400)).toBe(360);
    expect(clampChannel("h", -10)).toBe(0);
  });
});

describe("roundChannel", () => {
  it("rounds lightness and chroma to three decimals", () => {
    expect(roundChannel("l", 0.62831)).toBe(0.628);
    expect(roundChannel("c", 0.15049)).toBe(0.15);
  });

  it("rounds hue to one decimal", () => {
    expect(roundChannel("h", 29.234)).toBe(29.2);
  });
});

describe("CHANNELS", () => {
  it("publishes a sane spinner step for each channel", () => {
    expect(CHANNELS.l.step).toBe(0.01);
    expect(CHANNELS.c.step).toBe(0.005);
    expect(CHANNELS.h.step).toBe(1);
  });
});
