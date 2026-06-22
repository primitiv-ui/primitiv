import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

import { useGamutPaint } from "../useGamutPaint";
import { blitBuffer } from "../paint";
import {
  paint_lc_plane,
  paint_ch_plane,
  paint_lh_plane,
  paint_hue_strip,
  paint_lightness_strip,
  paint_chroma_strip,
} from "harmoni-wasm";
import { C_MAX } from "../geometry";
import type { Gamut, OklchValue } from "../types";

vi.mock("harmoni-wasm", () => ({
  paint_lc_plane: vi.fn(),
  paint_ch_plane: vi.fn(),
  paint_lh_plane: vi.fn(),
  paint_hue_strip: vi.fn(),
  paint_lightness_strip: vi.fn(),
  paint_chroma_strip: vi.fn(),
}));
vi.mock("../paint", () => ({ blitBuffer: vi.fn() }));

const planeMock = vi.mocked(paint_lc_plane);
const chPlaneMock = vi.mocked(paint_ch_plane);
const lhPlaneMock = vi.mocked(paint_lh_plane);
const hueMock = vi.mocked(paint_hue_strip);
const lightMock = vi.mocked(paint_lightness_strip);
const chromaMock = vi.mocked(paint_chroma_strip);
const blitMock = vi.mocked(blitBuffer);

const planeRef = { current: "plane" as unknown as HTMLCanvasElement };
const lightnessPlaneRef = { current: "lplane" as unknown as HTMLCanvasElement };
const chromaPlaneRef = { current: "cplane" as unknown as HTMLCanvasElement };
const hueRef = { current: "hue" as unknown as HTMLCanvasElement };
const lightRef = { current: "light" as unknown as HTMLCanvasElement };
const chromaRef = { current: "chroma" as unknown as HTMLCanvasElement };

let frame: (() => void) | null;
const cancelled: number[] = [];

function flushFrame() {
  const fn = frame;
  frame = null;
  fn?.();
}

function setup(value: OklchValue, gamut: Gamut = "Srgb") {
  return renderHook(
    (props: { value: OklchValue; gamut: Gamut }) =>
      useGamutPaint({
        value: props.value,
        gamut: props.gamut,
        planeRef,
        lightnessPlaneRef,
        chromaPlaneRef,
        hueStripRef: hueRef,
        lightnessStripRef: lightRef,
        chromaStripRef: chromaRef,
        planeWidth: 100,
        planeHeight: 200,
        stripWidth: 360,
      }),
    { initialProps: { value, gamut } },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  frame = null;
  cancelled.length = 0;
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
  it("paints every chart against the gamut on first mount", () => {
    setup({ l: 0.6, c: 0.15, h: 250 });
    flushFrame();

    expect(planeMock).toHaveBeenCalledWith(250, 100, 200, C_MAX, "Srgb");
    expect(chPlaneMock).toHaveBeenCalledWith(0.6, 100, 200, C_MAX, "Srgb");
    expect(lhPlaneMock).toHaveBeenCalledWith(0.15, 100, 200, "Srgb");
    expect(hueMock).toHaveBeenCalledWith(0.6, 0.15, 360, "Srgb");
    expect(lightMock).toHaveBeenCalledWith(0.15, 250, 360, "Srgb");
    expect(chromaMock).toHaveBeenCalledWith(0.6, 250, 360, C_MAX, "Srgb");
    expect(blitMock).toHaveBeenCalledWith(planeRef.current, undefined, 100, 200, "srgb");
    expect(blitMock).toHaveBeenCalledWith(
      lightnessPlaneRef.current,
      undefined,
      100,
      200,
      "srgb",
    );
    expect(blitMock).toHaveBeenCalledWith(
      chromaPlaneRef.current,
      undefined,
      100,
      200,
      "srgb",
    );
  });

  it("repaints the Hue chart and L/C strips, not the others, when the hue changes", () => {
    const { rerender } = setup({ l: 0.6, c: 0.15, h: 250 });
    flushFrame();
    vi.clearAllMocks();

    rerender({ value: { l: 0.6, c: 0.15, h: 120 }, gamut: "Srgb" });
    flushFrame();

    expect(planeMock).toHaveBeenCalledOnce();
    expect(lightMock).toHaveBeenCalledOnce();
    expect(chromaMock).toHaveBeenCalledOnce();
    expect(chPlaneMock).not.toHaveBeenCalled();
    expect(lhPlaneMock).not.toHaveBeenCalled();
    expect(hueMock).not.toHaveBeenCalled();
  });

  it("repaints the Lightness chart, hue and chroma strips when the lightness changes", () => {
    const { rerender } = setup({ l: 0.6, c: 0.15, h: 250 });
    flushFrame();
    vi.clearAllMocks();

    rerender({ value: { l: 0.3, c: 0.15, h: 250 }, gamut: "Srgb" });
    flushFrame();

    expect(chPlaneMock).toHaveBeenCalledOnce();
    expect(hueMock).toHaveBeenCalledOnce();
    expect(chromaMock).toHaveBeenCalledOnce();
    expect(planeMock).not.toHaveBeenCalled();
    expect(lhPlaneMock).not.toHaveBeenCalled();
    expect(lightMock).not.toHaveBeenCalled();
  });

  it("repaints the Chroma chart, hue and lightness strips when the chroma changes", () => {
    const { rerender } = setup({ l: 0.6, c: 0.15, h: 250 });
    flushFrame();
    vi.clearAllMocks();

    rerender({ value: { l: 0.6, c: 0.05, h: 250 }, gamut: "Srgb" });
    flushFrame();

    expect(lhPlaneMock).toHaveBeenCalledOnce();
    expect(hueMock).toHaveBeenCalledOnce();
    expect(lightMock).toHaveBeenCalledOnce();
    expect(planeMock).not.toHaveBeenCalled();
    expect(chPlaneMock).not.toHaveBeenCalled();
    expect(chromaMock).not.toHaveBeenCalled();
  });

  it("repaints every chart in the display-p3 colour space when the gamut changes", () => {
    const { rerender } = setup({ l: 0.6, c: 0.15, h: 250 });
    flushFrame();
    vi.clearAllMocks();

    rerender({ value: { l: 0.6, c: 0.15, h: 250 }, gamut: "DisplayP3" });
    flushFrame();

    expect(planeMock).toHaveBeenCalledWith(250, 100, 200, C_MAX, "DisplayP3");
    expect(chPlaneMock).toHaveBeenCalledWith(0.6, 100, 200, C_MAX, "DisplayP3");
    expect(lhPlaneMock).toHaveBeenCalledWith(0.15, 100, 200, "DisplayP3");
    expect(blitMock).toHaveBeenCalledWith(planeRef.current, undefined, 100, 200, "display-p3");
    expect(blitMock).toHaveBeenCalledWith(chromaRef.current, undefined, 360, 1, "display-p3");
  });

  it("repaints every chart when the chart size changes", () => {
    const value = { l: 0.6, c: 0.15, h: 250 };
    const { rerender } = renderHook(
      (props: { planeWidth: number; planeHeight: number }) =>
        useGamutPaint({
          value,
          gamut: "Srgb",
          planeRef,
          lightnessPlaneRef,
          chromaPlaneRef,
          hueStripRef: hueRef,
          lightnessStripRef: lightRef,
          chromaStripRef: chromaRef,
          planeWidth: props.planeWidth,
          planeHeight: props.planeHeight,
          stripWidth: props.planeWidth,
        }),
      { initialProps: { planeWidth: 100, planeHeight: 200 } },
    );
    flushFrame();
    vi.clearAllMocks();

    rerender({ planeWidth: 600, planeHeight: 300 });
    flushFrame();

    expect(planeMock).toHaveBeenCalledWith(250, 600, 300, C_MAX, "Srgb");
    expect(chPlaneMock).toHaveBeenCalledOnce();
    expect(lhPlaneMock).toHaveBeenCalledOnce();
    expect(hueMock).toHaveBeenCalledOnce();
    expect(lightMock).toHaveBeenCalledOnce();
    expect(chromaMock).toHaveBeenCalledOnce();
  });

  it("schedules no frame when nothing changes", () => {
    const { rerender } = setup({ l: 0.6, c: 0.15, h: 250 });
    flushFrame();

    rerender({ value: { l: 0.6, c: 0.15, h: 250 }, gamut: "Srgb" });

    expect(frame).toBeNull();
  });

  it("cancels a pending frame when the value changes again before it fires", () => {
    const { rerender } = setup({ l: 0.6, c: 0.15, h: 250 });

    rerender({ value: { l: 0.6, c: 0.15, h: 120 }, gamut: "Srgb" });

    expect(cancelled).toContain(7);
  });

  it("coalesces a cancelled paint into the next frame", () => {
    const { rerender } = setup({ l: 0.6, c: 0.15, h: 250 });
    rerender({ value: { l: 0.6, c: 0.15, h: 120 }, gamut: "Srgb" });
    rerender({ value: { l: 0.3, c: 0.15, h: 120 }, gamut: "Srgb" });
    flushFrame();

    expect(planeMock).toHaveBeenCalledWith(120, 100, 200, C_MAX, "Srgb");
    expect(chPlaneMock).toHaveBeenCalledWith(0.3, 100, 200, C_MAX, "Srgb");
  });
});
