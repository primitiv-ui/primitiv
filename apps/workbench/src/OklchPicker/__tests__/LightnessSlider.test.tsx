import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

import { LightnessSlider } from "../LightnessSlider";
import { triggerResize } from "./resizeObserverMock";
import { paint_lightness_strip } from "harmoni-wasm";

vi.mock("harmoni-wasm", () => ({
  paint_lightness_strip: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(paint_lightness_strip).mockReturnValue(new Uint8Array());
});

describe("LightnessSlider", () => {
  it("exposes a labelled slider at the given lightness", () => {
    render(<LightnessSlider value={0.4} onChange={vi.fn()} label="White" />);

    const slider = screen.getByRole("slider", { name: "White" });
    expect(slider).toHaveAttribute("aria-valuenow", "0.4");
  });

  it("paints the lightness track at the measured width, neutral by default", () => {
    render(<LightnessSlider value={0.5} onChange={vi.fn()} />);

    act(() => triggerResize(300, 0));

    // Default chroma 0 / hue 0 → a neutral black→white ramp, in sRGB.
    expect(paint_lightness_strip).toHaveBeenCalledWith(0, 0, 300, "Srgb");
  });

  it("repaints the track for an explicit chroma, hue and gamut", () => {
    render(
      <LightnessSlider
        value={0.5}
        onChange={vi.fn()}
        chroma={0.1}
        hue={120}
        gamut="DisplayP3"
      />,
    );

    act(() => triggerResize(256, 0));

    expect(paint_lightness_strip).toHaveBeenCalledWith(0.1, 120, 256, "DisplayP3");
  });

  it("forwards the thumb's value through onChange", () => {
    const onChange = vi.fn();
    render(<LightnessSlider value={0.5} onChange={onChange} label="Black" />);

    const slider = screen.getByRole("slider", { name: "Black" });
    slider.focus();
    act(() => triggerResize(300, 0));
    // Slider's keyboard step nudges the value and forwards it.
    slider.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );

    expect(onChange).toHaveBeenCalled();
  });
});
