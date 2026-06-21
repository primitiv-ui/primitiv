import { describe, it, expect, vi, beforeEach } from "vitest";

import { parseColor, formatColor } from "../color";
import { parse_color, describe_oklch } from "harmoni-wasm";

vi.mock("harmoni-wasm", () => ({
  parse_color: vi.fn(),
  describe_oklch: vi.fn(),
}));

const parseColorMock = vi.mocked(parse_color);
const describeOklchMock = vi.mocked(describe_oklch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("parseColor", () => {
  it("returns the OkLCH triple the engine parses out of a colour string", () => {
    parseColorMock.mockReturnValue({
      l: 0.628,
      c: 0.2577,
      h: 29.23,
      hex: "#ff0000",
      rgb: { r: 1, g: 0, b: 0 },
      oklch: "oklch(0.628 0.2577 29.23)",
    });

    const value = parseColor("#ff0000");

    expect(parseColorMock).toHaveBeenCalledWith("#ff0000");
    expect(value).toEqual({ l: 0.628, c: 0.2577, h: 29.23 });
  });

  it("returns null when the engine rejects the string", () => {
    parseColorMock.mockImplementation(() => {
      throw new Error("Invalid color input");
    });

    expect(parseColor("not-a-colour")).toBeNull();
  });
});

describe("formatColor", () => {
  it("renders the value's hex and oklch strings through the engine", () => {
    describeOklchMock.mockReturnValue({
      l: 0.6,
      c: 0.15,
      h: 250,
      hex: "#5b7fc7",
      rgb: { r: 0.36, g: 0.5, b: 0.78 },
      oklch: "oklch(0.6 0.15 250)",
    });

    const formatted = formatColor({ l: 0.6, c: 0.15, h: 250 });

    expect(describeOklchMock).toHaveBeenCalledWith(0.6, 0.15, 250);
    expect(formatted).toEqual({
      hex: "#5b7fc7",
      oklch: "oklch(0.6 0.15 250)",
    });
  });
});
