import { describe, it, expect, vi, beforeEach } from "vitest";

import { boundaryPoints } from "../boundary";
import { max_in_gamut_chroma } from "harmoni-wasm";

vi.mock("harmoni-wasm", () => ({ max_in_gamut_chroma: vi.fn() }));

const maxChromaMock = vi.mocked(max_in_gamut_chroma);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("boundaryPoints", () => {
  it("sweeps the boundary chroma across evenly spaced lightness samples", () => {
    maxChromaMock.mockReturnValue(0.2);

    const points = boundaryPoints(250, 100, 200, 0.4, 3);

    expect(maxChromaMock).toHaveBeenCalledWith(0, 250);
    expect(maxChromaMock).toHaveBeenCalledWith(0.5, 250);
    expect(maxChromaMock).toHaveBeenCalledWith(1, 250);
    expect(points).toBe("0,100 50,100 100,100");
  });

  it("clamps a boundary chroma above c_max to the top edge", () => {
    maxChromaMock.mockReturnValue(0.6);

    const points = boundaryPoints(250, 100, 200, 0.4, 2);

    expect(points).toBe("0,0 100,0");
  });
});
