import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

import { useGamutPaint } from "../useGamutPaint";
import { blitBuffer } from "../paint";
import { paint_lc_plane, paint_hue_strip } from "harmoni-wasm";
import { C_MAX } from "../geometry";
import type { OklchValue } from "../types";

vi.mock("harmoni-wasm", () => ({
  paint_lc_plane: vi.fn(),
  paint_hue_strip: vi.fn(),
}));
vi.mock("../paint", () => ({ blitBuffer: vi.fn() }));

const planeMock = vi.mocked(paint_lc_plane);
const stripMock = vi.mocked(paint_hue_strip);
const blitMock = vi.mocked(blitBuffer);

const PLANE_BUF = new Uint8Array([1]);
const STRIP_BUF = new Uint8Array([2]);
const planeRef = { current: "plane-canvas" as unknown as HTMLCanvasElement };
const stripRef = { current: "strip-canvas" as unknown as HTMLCanvasElement };

let frame: (() => void) | null;
const cancelled: number[] = [];

function flushFrame() {
  const fn = frame;
  frame = null;
  fn?.();
}

function setup(value: OklchValue) {
  return renderHook((props: OklchValue) => useGamutPaint({
    value: props,
    planeRef,
    stripRef,
    planeWidth: 100,
    planeHeight: 200,
    stripWidth: 360,
  }), { initialProps: value });
}

beforeEach(() => {
  vi.clearAllMocks();
  frame = null;
  cancelled.length = 0;
  planeMock.mockReturnValue(PLANE_BUF);
  stripMock.mockReturnValue(STRIP_BUF);
  vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
    frame = cb;
    return 7;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    cancelled.push(id);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useGamutPaint", () => {
  it("paints both charts on first mount", () => {
    setup({ l: 0.6, c: 0.15, h: 250 });
    flushFrame();

    expect(planeMock).toHaveBeenCalledWith(250, 100, 200, C_MAX);
    expect(stripMock).toHaveBeenCalledWith(0.6, 0.15, 360);
    expect(blitMock).toHaveBeenCalledWith(planeRef.current, PLANE_BUF, 100, 200);
    expect(blitMock).toHaveBeenCalledWith(stripRef.current, STRIP_BUF, 360, 1);
  });

  it("repaints only the plane when the hue changes", () => {
    const { rerender } = setup({ l: 0.6, c: 0.15, h: 250 });
    flushFrame();
    vi.clearAllMocks();

    rerender({ l: 0.6, c: 0.15, h: 120 });
    flushFrame();

    expect(planeMock).toHaveBeenCalledOnce();
    expect(planeMock).toHaveBeenCalledWith(120, 100, 200, C_MAX);
    expect(stripMock).not.toHaveBeenCalled();
  });

  it("repaints only the strip when the lightness changes", () => {
    const { rerender } = setup({ l: 0.6, c: 0.15, h: 250 });
    flushFrame();
    vi.clearAllMocks();

    rerender({ l: 0.3, c: 0.15, h: 250 });
    flushFrame();

    expect(stripMock).toHaveBeenCalledOnce();
    expect(stripMock).toHaveBeenCalledWith(0.3, 0.15, 360);
    expect(planeMock).not.toHaveBeenCalled();
  });

  it("schedules no frame when the value is unchanged", () => {
    const { rerender } = setup({ l: 0.6, c: 0.15, h: 250 });
    flushFrame();

    rerender({ l: 0.6, c: 0.15, h: 250 });

    expect(frame).toBeNull();
  });

  it("cancels a pending frame when the value changes again before it fires", () => {
    const { rerender } = setup({ l: 0.6, c: 0.15, h: 250 });

    rerender({ l: 0.6, c: 0.15, h: 120 });

    expect(cancelled).toContain(7);
  });

  it("coalesces a cancelled paint into the next frame", () => {
    const { rerender } = setup({ l: 0.6, c: 0.15, h: 250 });
    // First frame never fires — hue changes, then lightness changes.
    rerender({ l: 0.6, c: 0.15, h: 120 });
    rerender({ l: 0.3, c: 0.15, h: 120 });
    flushFrame();

    expect(planeMock).toHaveBeenCalledWith(120, 100, 200, C_MAX);
    expect(stripMock).toHaveBeenCalledWith(0.3, 0.15, 360);
  });
});
