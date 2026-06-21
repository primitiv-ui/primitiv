import { describe, it, expect, vi } from "vitest";

import { blitBuffer } from "../paint";

function fakeCanvas(ctx: unknown): HTMLCanvasElement {
  return { getContext: vi.fn().mockReturnValue(ctx) } as unknown as HTMLCanvasElement;
}

describe("blitBuffer", () => {
  it("does nothing when the canvas is null", () => {
    expect(() => blitBuffer(null, new Uint8Array(4), 1, 1)).not.toThrow();
  });

  it("does nothing when the 2D context is unavailable", () => {
    const canvas = fakeCanvas(null);

    expect(() => blitBuffer(canvas, new Uint8Array(4), 1, 1)).not.toThrow();
  });

  it("writes the buffer to the context as ImageData of the given size", () => {
    const putImageData = vi.fn();
    const canvas = fakeCanvas({ putImageData });
    const buffer = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]);

    blitBuffer(canvas, buffer, 2, 1);

    expect(putImageData).toHaveBeenCalledTimes(1);
    const [image, dx, dy] = putImageData.mock.calls[0];
    expect(image.width).toBe(2);
    expect(image.height).toBe(1);
    expect(Array.from(image.data)).toEqual([10, 20, 30, 40, 50, 60, 70, 80]);
    expect(dx).toBe(0);
    expect(dy).toBe(0);
  });

  it("requests a display-p3 context so wide-gamut buffers are not clamped", () => {
    const getContext = vi.fn().mockReturnValue({ putImageData: vi.fn() });
    const canvas = { getContext } as unknown as HTMLCanvasElement;

    blitBuffer(canvas, new Uint8Array(4), 1, 1);

    expect(getContext).toHaveBeenCalledWith("2d", { colorSpace: "display-p3" });
  });

  it("defaults the ImageData to the srgb colour space", () => {
    const putImageData = vi.fn();
    const canvas = fakeCanvas({ putImageData });

    blitBuffer(canvas, new Uint8Array(4), 1, 1);

    expect(putImageData.mock.calls[0][0].colorSpace).toBe("srgb");
  });

  it("tags the ImageData with the requested colour space", () => {
    const putImageData = vi.fn();
    const canvas = fakeCanvas({ putImageData });

    blitBuffer(canvas, new Uint8Array(4), 1, 1, "display-p3");

    expect(putImageData.mock.calls[0][0].colorSpace).toBe("display-p3");
  });
});
