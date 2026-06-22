import { describe, it, expect, vi, beforeEach } from "vitest";

import { boundaryPoints, chromaBoundaryPoints, hueBoundaryPoints } from "../boundary";
import { max_in_gamut_chroma } from "harmoni-wasm";

vi.mock("harmoni-wasm", () => ({ max_in_gamut_chroma: vi.fn() }));

const maxChromaMock = vi.mocked(max_in_gamut_chroma);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("boundaryPoints", () => {
  it("sweeps the boundary chroma across evenly spaced lightness samples for the gamut", () => {
    maxChromaMock.mockReturnValue(0.2);

    const points = boundaryPoints(250, 100, 200, 0.4, 3, "Srgb");

    expect(maxChromaMock).toHaveBeenCalledWith(0, 250, "Srgb");
    expect(maxChromaMock).toHaveBeenCalledWith(0.5, 250, "Srgb");
    expect(maxChromaMock).toHaveBeenCalledWith(1, 250, "Srgb");
    expect(points).toBe("0,100 50,100 100,100");
  });

  it("sweeps the Display-P3 boundary when that gamut is given", () => {
    maxChromaMock.mockReturnValue(0.2);

    boundaryPoints(250, 100, 200, 0.4, 2, "DisplayP3");

    expect(maxChromaMock).toHaveBeenCalledWith(0, 250, "DisplayP3");
    expect(maxChromaMock).toHaveBeenCalledWith(1, 250, "DisplayP3");
  });

  it("clamps a boundary chroma above c_max to the top edge", () => {
    maxChromaMock.mockReturnValue(0.6);

    const points = boundaryPoints(250, 100, 200, 0.4, 2, "Srgb");

    expect(points).toBe("0,0 100,0");
  });
});

describe("chromaBoundaryPoints", () => {
  it("sweeps the max chroma across hue at the fixed lightness", () => {
    maxChromaMock.mockReturnValue(0.2);

    const points = chromaBoundaryPoints(0.6, 100, 200, 0.4, 3, "Srgb");

    expect(maxChromaMock).toHaveBeenCalledWith(0.6, 0, "Srgb");
    expect(maxChromaMock).toHaveBeenCalledWith(0.6, 180, "Srgb");
    expect(maxChromaMock).toHaveBeenCalledWith(0.6, 360, "Srgb");
    expect(points).toBe("0,100 50,100 100,100");
  });

  it("clamps a boundary chroma above c_max to the top edge", () => {
    maxChromaMock.mockReturnValue(0.6);

    const points = chromaBoundaryPoints(0.6, 100, 200, 0.4, 2, "DisplayP3");

    expect(maxChromaMock).toHaveBeenCalledWith(0.6, 0, "DisplayP3");
    expect(points).toBe("0,0 100,0");
  });
});

// A triangular gamut: chroma peaks at l 0.5 and falls to 0 at the lightness ends.
const triangular = (peak: number) => (l: number) =>
  peak * (1 - Math.abs(2 * l - 1));

describe("hueBoundaryPoints", () => {
  it("traces the upper and lower lightness limits at the fixed chroma", () => {
    maxChromaMock.mockImplementation(triangular(0.3));

    const { upper, lower } = hueBoundaryPoints(0.15, 100, 200, 2, "Srgb", 4);

    // chroma 0.15 is reached between lightness 0.25 and 0.75; lightness runs
    // bottom→top so the high limit (0.75) is the upper curve (y 50).
    expect(upper).toBe("0,50 100,50");
    expect(lower).toBe("0,150 100,150");
  });

  it("pinches the limits to the peak where the chroma is unreachable", () => {
    maxChromaMock.mockImplementation(triangular(0.1));

    const { upper, lower } = hueBoundaryPoints(0.2, 100, 200, 2, "Srgb", 4);

    // peak chroma 0.1 < 0.2, so both limits collapse to the peak lightness 0.5.
    expect(upper).toBe("0,100 100,100");
    expect(lower).toBe("0,100 100,100");
  });

  it("spans the whole lightness range when the chroma is zero", () => {
    maxChromaMock.mockImplementation(triangular(0.3));

    const { upper, lower } = hueBoundaryPoints(0, 100, 200, 2, "Srgb", 4);

    expect(upper).toBe("0,0 100,0");
    expect(lower).toBe("0,200 100,200");
  });
});
