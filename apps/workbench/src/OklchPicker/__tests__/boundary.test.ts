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
  it("traces the upper and lower lightness limits as a continuous segment", () => {
    maxChromaMock.mockImplementation(triangular(0.3));

    const { upper, lower } = hueBoundaryPoints(0.15, 100, 200, 2, "Srgb", 4);

    // chroma 0.15 is reached between lightness 0.25 and 0.75; lightness runs
    // bottom→top so the high limit (0.75) is the upper curve (y 50).
    expect(upper).toEqual(["0,50 100,50"]);
    expect(lower).toEqual(["0,150 100,150"]);
  });

  it("breaks the curve into nothing where the chroma is unreachable", () => {
    maxChromaMock.mockImplementation(triangular(0.1));

    const { upper, lower } = hueBoundaryPoints(0.2, 100, 200, 2, "Srgb", 4);

    // peak chroma 0.1 < 0.2 at every hue, so the band has no in-gamut segment.
    expect(upper).toEqual([]);
    expect(lower).toEqual([]);
  });

  it("splits the band into separate segments around an unreachable hue", () => {
    // Reachable at the hue ends, unreachable in the middle → two segments.
    maxChromaMock.mockImplementation((_l: number, hue: number) =>
      hue === 180 ? 0.1 : triangular(0.3)(_l),
    );

    const { upper, lower } = hueBoundaryPoints(0.2, 100, 200, 3, "Srgb", 4);

    expect(upper).toHaveLength(2);
    expect(lower).toHaveLength(2);
  });

  it("ignores a detached near-black sliver, taking the band around the peak", () => {
    // In gamut at l=0 (a near-black sliver), out across a dead zone, then the
    // real band 0.4..0.6 around the peak at 0.5 — the lower bound must not spike
    // to 0 but sit at the real band's foot.
    const profile = [0.2, 0, 0, 0, 0.2, 0.3, 0.2, 0, 0, 0, 0];
    maxChromaMock.mockImplementation((l: number) => profile[Math.round(l * 10)]);

    const { upper, lower } = hueBoundaryPoints(0.15, 100, 200, 2, "Srgb", 10);

    // band foot ~0.375 → y 125; band head ~0.625 → y 75 (not 0 from the sliver).
    expect(lower).toEqual(["0,125 100,125"]);
    expect(upper).toEqual(["0,75 100,75"]);
  });

  it("keeps an edge that is already in gamut as the limit", () => {
    maxChromaMock.mockReturnValue(0.3);

    const { upper, lower } = hueBoundaryPoints(0.15, 100, 200, 2, "Srgb", 4);

    // max chroma 0.3 >= 0.15 at every lightness, so the window spans 0..1.
    expect(upper).toEqual(["0,0 100,0"]);
    expect(lower).toEqual(["0,200 100,200"]);
  });

  it("spans the whole lightness range when the chroma is zero", () => {
    maxChromaMock.mockImplementation(triangular(0.3));

    const { upper, lower } = hueBoundaryPoints(0, 100, 200, 2, "Srgb", 4);

    expect(upper).toEqual(["0,0 100,0"]);
    expect(lower).toEqual(["0,200 100,200"]);
  });
});
