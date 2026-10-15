import { describe, expect, it } from "vitest";

import { blendMaps, blendValue } from "./blend";

describe("blendValue", () => {
  it("returns the shared value untouched when both ends agree", () => {
    expect(blendValue("Asta Sans", "Asta Sans", 0.3)).toBe("Asta Sans");
  });

  it("lerps two lengths in the same unit", () => {
    expect(blendValue("1rem", "2rem", 0.25)).toBe("1.25rem");
  });

  it("lerps unitless numbers", () => {
    expect(blendValue("400", "600", 0.5)).toBe("500");
  });

  it("treats a bare 0 as a zero length in the other side's unit", () => {
    expect(blendValue("0", "0.5rem", 0.5)).toBe("0.25rem");
  });

  it("falls back to calc() for mismatched units or expressions", () => {
    expect(blendValue("1rem", "12px", 0.5)).toBe("calc(1rem * 0.5 + 12px * 0.5)");
    expect(blendValue("calc(2rem / 4)", "1rem", 0.5)).toBe(
      "calc(calc(2rem / 4) * 0.5 + 1rem * 0.5)",
    );
  });

  it("snaps non-numeric values at the halfway point", () => {
    expect(blendValue("Regular", "Medium", 0.49)).toBe("Regular");
    expect(blendValue("Regular", "Medium", 0.5)).toBe("Medium");
  });
});

describe("blendMaps", () => {
  it("emits only the properties whose ends differ", () => {
    const a = { "--gap": "1rem", "--font": "Khand" };
    const b = { "--gap": "2rem", "--font": "Khand" };
    expect(blendMaps(a, b, 0.5)).toEqual({ "--gap": "1.5rem" });
  });
});
