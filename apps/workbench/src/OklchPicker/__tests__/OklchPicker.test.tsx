import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { OklchPicker } from "../OklchPicker";
import { triggerResize } from "./resizeObserverMock";
import type { OklchValue } from "../types";
import {
  max_in_gamut_chroma,
  paint_lc_plane,
  paint_ch_plane,
  paint_lh_plane,
  paint_hue_strip,
  paint_lightness_strip,
  paint_chroma_strip,
  describe_oklch,
  parse_color,
} from "harmoni-wasm";

vi.mock("harmoni-wasm", () => ({
  max_in_gamut_chroma: vi.fn(),
  paint_lc_plane: vi.fn(),
  paint_ch_plane: vi.fn(),
  paint_lh_plane: vi.fn(),
  paint_hue_strip: vi.fn(),
  paint_lightness_strip: vi.fn(),
  paint_chroma_strip: vi.fn(),
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
  vi.mocked(paint_ch_plane).mockReturnValue(new Uint8Array());
  vi.mocked(paint_lh_plane).mockReturnValue(new Uint8Array());
  vi.mocked(paint_hue_strip).mockReturnValue(new Uint8Array());
  vi.mocked(paint_lightness_strip).mockReturnValue(new Uint8Array());
  vi.mocked(paint_chroma_strip).mockReturnValue(new Uint8Array());
  vi.mocked(describe_oklch).mockReturnValue(triple());
  vi.mocked(parse_color).mockReturnValue(triple());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OklchPicker", () => {
  it("renders the three linked charts of the oklch.com net", () => {
    renderPicker();

    // Hue chart (L×C), Lightness chart (Hue×Chroma), Chroma chart (Hue×Lightness).
    expect(
      screen.getByRole("group", { name: /lightness and chroma/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: /hue and chroma/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: /hue and lightness/i }),
    ).toBeInTheDocument();
  });

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

  it("merges a hue change from the hue slider, preserving lightness and chroma", async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker();

    screen.getByRole("slider", { name: "Hue" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalledWith({ l: 0.6, c: 0.15, h: 251 });
  });

  it("merges a lightness change from the lightness slider", async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker();

    screen.getByRole("slider", { name: "Lightness" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalledWith({ l: 0.61, c: 0.15, h: 250 });
  });

  it("merges a chroma change from the chroma slider", async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker();

    screen.getByRole("slider", { name: "Chroma" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalledWith({ l: 0.6, c: 0.155, h: 250 });
  });

  it("paints the charts at the device-pixel-scaled measured size", () => {
    vi.stubGlobal("devicePixelRatio", 2);
    vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
      cb();
      return 0;
    });
    renderPicker();

    // A 600px-wide container → 600×300 charts (2:1), ×2 dpr → a 1200×600 buffer.
    act(() => triggerResize(600, 0));

    expect(paint_lc_plane).toHaveBeenCalledWith(250, 1200, 600, expect.any(Number), "Srgb");
    expect(paint_hue_strip).toHaveBeenCalledWith(0.6, 0.15, 1200, "Srgb");
  });

  it("falls back to a 1:1 backing store when devicePixelRatio is unavailable", () => {
    vi.stubGlobal("devicePixelRatio", 0);
    vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
      cb();
      return 0;
    });
    renderPicker();

    act(() => triggerResize(600, 0));

    expect(paint_lc_plane).toHaveBeenCalledWith(250, 600, 300, expect.any(Number), "Srgb");
  });

  it("sizes the chart canvas backing store to the scaled measured size", () => {
    vi.stubGlobal("devicePixelRatio", 2);
    renderPicker();

    act(() => triggerResize(600, 0));

    const canvas = document.querySelector(
      ".plane-chart__plane",
    ) as HTMLCanvasElement;
    expect(canvas.width).toBe(1200);
    expect(canvas.height).toBe(600);
  });

  it("draws the P3 extended boundary once the gamut toggle is switched", async () => {
    const user = userEvent.setup();
    renderPicker();
    const pad = screen.getByRole("group", { name: /lightness.*chroma/i });
    expect(pad.querySelectorAll("polyline")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "P3" }));

    expect(pad.querySelectorAll("polyline")).toHaveLength(2);
  });
});
