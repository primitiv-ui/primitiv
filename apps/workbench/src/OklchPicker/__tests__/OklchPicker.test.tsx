import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { OklchPicker } from "../OklchPicker";
import {
  max_in_gamut_chroma,
  paint_lc_plane,
  paint_hue_strip,
  describe_oklch,
  parse_color,
} from "harmoni-wasm";

vi.mock("harmoni-wasm", () => ({
  max_in_gamut_chroma: vi.fn(),
  paint_lc_plane: vi.fn(),
  paint_hue_strip: vi.fn(),
  describe_oklch: vi.fn(),
  parse_color: vi.fn(),
}));

const VALUE = { l: 0.6, c: 0.15, h: 250 };

const triple = (over = {}) => ({
  l: 0.6,
  c: 0.15,
  h: 250,
  hex: "#5b7fc7",
  rgb: { r: 0.36, g: 0.5, b: 0.78 },
  oklch: "oklch(0.6 0.15 250)",
  ...over,
});

function renderPicker(onChange = vi.fn(), value = VALUE) {
  render(<OklchPicker value={value} onChange={onChange} />);
  return { onChange };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(max_in_gamut_chroma).mockReturnValue(0.3);
  vi.mocked(paint_lc_plane).mockReturnValue(new Uint8Array());
  vi.mocked(paint_hue_strip).mockReturnValue(new Uint8Array());
  vi.mocked(describe_oklch).mockReturnValue(triple());
  vi.mocked(parse_color).mockReturnValue(triple());
});

describe("OklchPicker", () => {
  it("shows the value's formatted string in the text field", () => {
    renderPicker();

    expect(screen.getByLabelText(/hex or oklch/i)).toHaveValue(
      "oklch(0.6 0.15 250)",
    );
  });

  it("updates lightness from the L field", () => {
    const { onChange } = renderPicker();

    fireEvent.change(screen.getByRole("spinbutton", { name: "Lightness" }), {
      target: { value: "0.4" },
    });

    expect(onChange).toHaveBeenCalledWith({ l: 0.4, c: 0.15, h: 250 });
  });

  it("updates chroma from the C field", () => {
    const { onChange } = renderPicker();

    fireEvent.change(screen.getByRole("spinbutton", { name: "Chroma" }), {
      target: { value: "0.1" },
    });

    expect(onChange).toHaveBeenCalledWith({ l: 0.6, c: 0.1, h: 250 });
  });

  it("updates hue from the H field", () => {
    const { onChange } = renderPicker();

    fireEvent.change(screen.getByRole("spinbutton", { name: "Hue" }), {
      target: { value: "120" },
    });

    expect(onChange).toHaveBeenCalledWith({ l: 0.6, c: 0.15, h: 120 });
  });

  it("ignores a numeric field cleared to a non-number", () => {
    const { onChange } = renderPicker();

    fireEvent.change(screen.getByRole("spinbutton", { name: "Lightness" }), {
      target: { value: "" },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("parses a valid colour typed into the text field", () => {
    const { onChange } = renderPicker();
    vi.mocked(parse_color).mockReturnValue(
      triple({ l: 0.628, c: 0.2577, h: 29.23 }),
    );

    fireEvent.change(screen.getByLabelText(/hex or oklch/i), {
      target: { value: "#ff0000" },
    });

    expect(onChange).toHaveBeenCalledWith({ l: 0.628, c: 0.2577, h: 29.23 });
  });

  it("flags an unparseable text entry without emitting", () => {
    const { onChange } = renderPicker();
    vi.mocked(parse_color).mockImplementation(() => {
      throw new Error("invalid");
    });

    fireEvent.change(screen.getByLabelText(/hex or oklch/i), {
      target: { value: "nope" },
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("merges an L×C pad drag, preserving hue", () => {
    const { onChange } = renderPicker();
    const pad = screen.getByRole("group", { name: /lightness.*chroma/i });
    pad.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 280, height: 280 }) as DOMRect;

    fireEvent.pointerDown(pad, { clientX: 140, clientY: 140, pointerId: 1 });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ l: 0.5, h: 250 }),
    );
  });

  it("merges a hue change, preserving lightness and chroma", async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker();

    screen.getByRole("slider").focus();
    await user.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalledWith({ l: 0.6, c: 0.15, h: 251 });
  });
});
