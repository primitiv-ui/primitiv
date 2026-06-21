import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";

import { LcChart } from "../LcChart";
import { max_in_gamut_chroma } from "harmoni-wasm";

vi.mock("harmoni-wasm", () => ({ max_in_gamut_chroma: vi.fn() }));

const maxChromaMock = vi.mocked(max_in_gamut_chroma);

const VALUE = { l: 0.6, c: 0.15, h: 250 };

function renderChart(onChange = vi.fn(), gamut: "Srgb" | "DisplayP3" = "Srgb") {
  const planeRef = createRef<HTMLCanvasElement>();
  render(
    <LcChart
      value={VALUE}
      gamut={gamut}
      onChange={onChange}
      planeRef={planeRef}
      width={100}
      height={200}
    />,
  );
  const pad = screen.getByRole("group", { name: /lightness.*chroma/i });
  pad.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 100, height: 200 }) as DOMRect;
  return { onChange, planeRef, pad };
}

beforeEach(() => {
  vi.clearAllMocks();
  maxChromaMock.mockReturnValue(0.3);
});

describe("LcChart", () => {
  it("attaches the plane canvas to the supplied ref", () => {
    const { planeRef } = renderChart();

    expect(planeRef.current).toBeInstanceOf(HTMLCanvasElement);
  });

  it("draws the gamut boundary polyline from the engine sweep", () => {
    const { pad } = renderChart();
    const polyline = pad.querySelector("polyline");

    expect(polyline?.getAttribute("points")).toMatch(/^0,50/);
  });

  it("draws only the sRGB boundary in sRGB mode", () => {
    const { pad } = renderChart();

    expect(pad.querySelectorAll("polyline")).toHaveLength(1);
  });

  it("draws a second boundary curve for the extended band in P3 mode", () => {
    const { pad } = renderChart(vi.fn(), "DisplayP3");

    expect(pad.querySelectorAll("polyline")).toHaveLength(2);
  });

  it("clamps the pointer against the active gamut boundary", () => {
    const { pad } = renderChart(vi.fn(), "DisplayP3");

    fireEvent.pointerDown(pad, { clientX: 50, clientY: 100, pointerId: 1 });

    expect(maxChromaMock).toHaveBeenCalledWith(0.5, 250, "DisplayP3");
  });

  it("positions the cursor at the current value", () => {
    const { pad } = renderChart();
    const cursor = pad.querySelector(".lc-chart__cursor") as HTMLElement;

    expect(cursor.style.left).toBe("60px");
    expect(cursor.style.top).toBe("125px");
  });

  it("emits the gamut-clamped value on pointer down", () => {
    const { onChange, pad } = renderChart();

    fireEvent.pointerDown(pad, { clientX: 50, clientY: 100, pointerId: 1 });

    expect(onChange).toHaveBeenCalledWith({ l: 0.5, c: 0.2 });
  });

  it("clamps chroma to the in-gamut boundary when the pointer exceeds it", () => {
    const { onChange, pad } = renderChart();

    fireEvent.pointerDown(pad, { clientX: 100, clientY: 0, pointerId: 1 });

    expect(onChange).toHaveBeenCalledWith({ l: 1, c: 0.3 });
  });

  it("emits while dragging after a pointer down", () => {
    const { onChange, pad } = renderChart();

    fireEvent.pointerDown(pad, { clientX: 0, clientY: 200, pointerId: 1 });
    onChange.mockClear();
    fireEvent.pointerMove(pad, { clientX: 50, clientY: 100, pointerId: 1 });

    expect(onChange).toHaveBeenCalledWith({ l: 0.5, c: 0.2 });
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

  it("is focusable so keyboard users can reach the pad", () => {
    const { pad } = renderChart();

    expect(pad).toHaveAttribute("tabindex", "0");
  });

  it("announces the current value in its accessible name", () => {
    const { pad } = renderChart();

    // VALUE = { l: 0.6, c: 0.15 }
    expect(pad.getAttribute("aria-label")).toMatch(/0\.60.*0\.150/);
  });

  it("nudges lightness up on ArrowRight, gamut-clamping chroma", () => {
    const { onChange, pad } = renderChart();

    fireEvent.keyDown(pad, { key: "ArrowRight" });

    const arg = onChange.mock.calls.at(-1)![0];
    expect(arg.l).toBeCloseTo(0.605);
    expect(arg.c).toBeCloseTo(0.15);
  });

  it("nudges chroma up on ArrowUp", () => {
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
