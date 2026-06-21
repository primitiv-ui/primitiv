import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";

import { LcChart } from "../LcChart";
import { max_in_gamut_chroma } from "harmoni-wasm";

vi.mock("harmoni-wasm", () => ({ max_in_gamut_chroma: vi.fn() }));

const maxChromaMock = vi.mocked(max_in_gamut_chroma);

const VALUE = { l: 0.6, c: 0.15, h: 250 };

function renderChart(onChange = vi.fn()) {
  const planeRef = createRef<HTMLCanvasElement>();
  render(
    <LcChart
      value={VALUE}
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
});
