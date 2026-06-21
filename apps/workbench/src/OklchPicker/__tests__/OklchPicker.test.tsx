import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { OklchPicker } from "../OklchPicker";
import type { OklchValue } from "../types";
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

// A stateful host for the text-field round-trip tests: the picker is controlled,
// so softening only shows up once an edit actually flows back as a new value.
function Controlled({ initial = VALUE }: { initial?: OklchValue }) {
  const [value, setValue] = useState(initial);
  return <OklchPicker value={value} onChange={setValue} />;
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

  it("clamps an out-of-range lightness entry into [0, 1]", () => {
    const { onChange } = renderPicker();

    fireEvent.change(screen.getByRole("spinbutton", { name: "Lightness" }), {
      target: { value: "5" },
    });

    expect(onChange).toHaveBeenCalledWith({ l: 1, c: 0.15, h: 250 });
  });

  it("clamps a negative chroma entry to 0", () => {
    const { onChange } = renderPicker();

    fireEvent.change(screen.getByRole("spinbutton", { name: "Chroma" }), {
      target: { value: "-0.2" },
    });

    expect(onChange).toHaveBeenCalledWith({ l: 0.6, c: 0, h: 250 });
  });

  it("rounds noisy engine floats in the numeric fields", () => {
    renderPicker(vi.fn(), { l: 0.62831, c: 0.15049, h: 29.234 });

    expect(screen.getByRole("spinbutton", { name: "Lightness" })).toHaveValue(
      0.628,
    );
    expect(screen.getByRole("spinbutton", { name: "Hue" })).toHaveValue(29.2);
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

  it("keeps the in-progress text while the field is focused", () => {
    vi.mocked(describe_oklch).mockImplementation((l, c, h) =>
      triple({ l, c, h, oklch: `oklch(${l} ${c} ${h})` }),
    );
    vi.mocked(parse_color).mockReturnValue(triple({ l: 0.628, c: 0.258, h: 29 }));
    render(<Controlled />);
    const field = screen.getByLabelText(/hex or oklch/i);

    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: "#ff0000" } });

    expect(field).toHaveValue("#ff0000");
  });

  it("resyncs to the canonical string when the field loses focus", () => {
    vi.mocked(describe_oklch).mockImplementation((l, c, h) =>
      triple({ l, c, h, oklch: `oklch(${l} ${c} ${h})` }),
    );
    vi.mocked(parse_color).mockReturnValue(triple({ l: 0.628, c: 0.258, h: 29 }));
    render(<Controlled />);
    const field = screen.getByLabelText(/hex or oklch/i);

    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: "#ff0000" } });
    fireEvent.blur(field);

    expect(field).toHaveValue("oklch(0.628 0.258 29)");
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
