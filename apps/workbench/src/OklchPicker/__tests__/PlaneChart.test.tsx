import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";

import { PlaneChart, type PlaneAxisSpec } from "../PlaneChart";
import { max_in_gamut_chroma } from "harmoni-wasm";

vi.mock("harmoni-wasm", () => ({ max_in_gamut_chroma: vi.fn() }));

const maxChromaMock = vi.mocked(max_in_gamut_chroma);

const VALUE = { l: 0.6, c: 0.15, h: 250 };

// The Hue chart's axes: x = lightness, y = chroma (chroma is plotted → clamped).
const LIGHTNESS_AXIS: PlaneAxisSpec = {
  channel: "l",
  name: "Lightness",
  max: 1,
  step: 0.005,
  coarseStep: 0.05,
  precision: 2,
};
const CHROMA_AXIS: PlaneAxisSpec = {
  channel: "c",
  name: "Chroma",
  max: 0.4,
  step: 0.002,
  coarseStep: 0.02,
  precision: 3,
};
const HUE_AXIS: PlaneAxisSpec = {
  channel: "h",
  name: "Hue",
  max: 360,
  step: 1,
  coarseStep: 10,
  precision: 0,
};

const HUE_CHART = { x: LIGHTNESS_AXIS, y: CHROMA_AXIS };
// The Chroma chart's axes: x = hue, y = lightness (chroma is fixed → not clamped).
const CHROMA_CHART = { x: HUE_AXIS, y: LIGHTNESS_AXIS };

const SRGB_BOUNDARY = {
  className: "plane-chart__boundary plane-chart__boundary--srgb",
  points: "0,50 100,10",
};
const P3_BOUNDARY = {
  className: "plane-chart__boundary plane-chart__boundary--extended",
  points: "0,40 100,0",
};

function renderChart(
  props: Partial<Omit<Parameters<typeof PlaneChart>[0], "onChange">> = {},
) {
  const onChange = vi.fn();
  const planeRef = createRef<HTMLCanvasElement>();
  const axes = props.axes ?? HUE_CHART;
  render(
    <PlaneChart
      value={VALUE}
      gamut="Srgb"
      axes={axes}
      onChange={onChange}
      planeRef={planeRef}
      width={100}
      height={200}
      {...props}
    />,
  );
  const name = new RegExp(`${axes.x.name}.*${axes.y.name}`, "i");
  const pad = screen.getByRole("group", { name });
  pad.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 100, height: 200 }) as DOMRect;
  return { onChange, planeRef, pad };
}

beforeEach(() => {
  vi.clearAllMocks();
  maxChromaMock.mockReturnValue(0.3);
});

describe("PlaneChart", () => {
  it("attaches the plane canvas to the supplied ref", () => {
    const { planeRef } = renderChart();

    expect(planeRef.current).toBeInstanceOf(HTMLCanvasElement);
  });

  it("renders the supplied gamut-boundary polylines", () => {
    const { pad } = renderChart({ boundaries: [SRGB_BOUNDARY] });
    const polyline = pad.querySelector("polyline");

    expect(polyline?.getAttribute("points")).toBe("0,50 100,10");
  });

  it("renders no boundary polyline when none is supplied", () => {
    const { pad } = renderChart();

    expect(pad.querySelectorAll("polyline")).toHaveLength(0);
  });

  it("renders one boundary for sRGB and two for the P3 extended band", () => {
    const { pad } = renderChart({ boundaries: [SRGB_BOUNDARY, P3_BOUNDARY] });

    expect(pad.querySelectorAll("polyline")).toHaveLength(2);
  });

  it("draws the shared crosshair guide lines through the cursor", () => {
    const { pad } = renderChart();
    const guides = pad.querySelectorAll(".plane-chart__guide");

    // l 0.6 → x 60; c 0.15 → y 125.
    expect(guides[0].getAttribute("x1")).toBe("60");
    expect(guides[1].getAttribute("y1")).toBe("125");
  });

  it("clamps the pointer against the active gamut boundary", () => {
    const { pad } = renderChart({ gamut: "DisplayP3" });

    fireEvent.pointerDown(pad, { clientX: 50, clientY: 100, pointerId: 1 });

    expect(maxChromaMock).toHaveBeenCalledWith(0.5, 250, "DisplayP3");
  });

  it("positions the cursor at the current value as a percentage so it tracks the responsive size", () => {
    const { pad } = renderChart();
    const cursor = pad.querySelector(".plane-chart__cursor") as HTMLElement;

    // l 0.6 → 60%; c 0.15 of c_max 0.4 → (1 - 0.375) = 62.5%.
    expect(cursor.style.left).toBe("60%");
    expect(cursor.style.top).toBe("62.5%");
  });

  it("does not fix its own pixel size, leaving the responsive CSS to size it", () => {
    const { pad } = renderChart();

    expect(pad.style.width).toBe("");
    expect(pad.style.height).toBe("");
  });

  it("labels each guide line with its plotted channel, following the cursor", () => {
    const { pad } = renderChart();
    const xLabel = pad.querySelector(
      ".plane-chart__axis-label--x",
    ) as HTMLElement;
    const yLabel = pad.querySelector(
      ".plane-chart__axis-label--y",
    ) as HTMLElement;

    // Hue chart axes: x = lightness → "L" follows the vertical line at 60%;
    // y = chroma → "C" follows the horizontal line at 62.5%.
    expect(xLabel).toHaveTextContent("L");
    expect(xLabel.style.left).toBe("60%");
    expect(yLabel).toHaveTextContent("C");
    expect(yLabel.style.top).toBe("62.5%");
  });

  it("merges the gamut-clamped value on pointer down, preserving the fixed axis", () => {
    const { onChange, pad } = renderChart();

    fireEvent.pointerDown(pad, { clientX: 50, clientY: 100, pointerId: 1 });

    expect(onChange).toHaveBeenCalledWith({ l: 0.5, c: 0.2, h: 250 });
  });

  it("clamps chroma to the in-gamut boundary when the pointer exceeds it", () => {
    const { onChange, pad } = renderChart();

    fireEvent.pointerDown(pad, { clientX: 100, clientY: 0, pointerId: 1 });

    expect(onChange).toHaveBeenCalledWith({ l: 1, c: 0.3, h: 250 });
  });

  it("does not clamp chroma on a chart that holds chroma fixed", () => {
    const { onChange, pad } = renderChart({ axes: CHROMA_CHART });

    fireEvent.pointerDown(pad, { clientX: 50, clientY: 100, pointerId: 1 });

    expect(maxChromaMock).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith({ l: 0.5, c: 0.15, h: 180 });
  });

  it("emits while dragging after a pointer down", () => {
    const { onChange, pad } = renderChart();

    fireEvent.pointerDown(pad, { clientX: 0, clientY: 200, pointerId: 1 });
    onChange.mockClear();
    fireEvent.pointerMove(pad, { clientX: 50, clientY: 100, pointerId: 1 });

    expect(onChange).toHaveBeenCalledWith({ l: 0.5, c: 0.2, h: 250 });
  });

  it("does not emit on a pointer move without a preceding pointer down", () => {
    const { onChange, pad } = renderChart();

    fireEvent.pointerMove(pad, { clientX: 50, clientY: 100, pointerId: 1 });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("stops emitting after the pointer is released", () => {
    const { onChange, pad } = renderChart();

    fireEvent.pointerDown(pad, { clientX: 0, clientY: 200, pointerId: 1 });
    fireEvent.pointerUp(pad, { clientX: 0, clientY: 200, pointerId: 1 });
    onChange.mockClear();
    fireEvent.pointerMove(pad, { clientX: 50, clientY: 100, pointerId: 1 });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("is focusable so keyboard users can reach the chart", () => {
    const { pad } = renderChart();

    expect(pad).toHaveAttribute("tabindex", "0");
  });

  it("announces the two plotted axes and their values in its accessible name", () => {
    const { pad } = renderChart();

    expect(pad.getAttribute("aria-label")).toMatch(/lightness.*chroma/i);
    expect(pad.getAttribute("aria-label")).toMatch(/0\.60.*0\.150/);
  });

  it("nudges the x axis up on ArrowRight, gamut-clamping chroma", () => {
    const { onChange, pad } = renderChart();

    fireEvent.keyDown(pad, { key: "ArrowRight" });

    const arg = onChange.mock.calls.at(-1)![0];
    expect(arg.l).toBeCloseTo(0.605);
    expect(arg.c).toBeCloseTo(0.15);
  });

  it("nudges the y axis up on ArrowUp", () => {
    const { onChange, pad } = renderChart();

    fireEvent.keyDown(pad, { key: "ArrowUp" });

    const arg = onChange.mock.calls.at(-1)![0];
    expect(arg.l).toBeCloseTo(0.6);
    expect(arg.c).toBeCloseTo(0.152);
  });

  it("uses the coarse step when Shift is held", () => {
    const { onChange, pad } = renderChart();

    fireEvent.keyDown(pad, { key: "ArrowRight", shiftKey: true });

    expect(onChange.mock.calls.at(-1)![0].l).toBeCloseTo(0.65);
  });

  it("clamps a keyboard nudge to the in-gamut boundary", () => {
    maxChromaMock.mockReturnValue(0.1);
    const { onChange, pad } = renderChart();

    fireEvent.keyDown(pad, { key: "ArrowUp" });

    expect(onChange.mock.calls.at(-1)![0].c).toBeCloseTo(0.1);
  });

  it("ignores a non-arrow key without emitting", () => {
    const { onChange, pad } = renderChart();

    fireEvent.keyDown(pad, { key: "Enter" });

    expect(onChange).not.toHaveBeenCalled();
  });
});
