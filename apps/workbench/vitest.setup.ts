import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

import { installResizeObserverMock } from "./src/OklchPicker/__tests__/resizeObserverMock";

// jsdom ships no ResizeObserver and no layout; the picker measures its charts
// with one, so install a controllable stand-in (driven by `triggerResize`).
installResizeObserverMock();

// jsdom ships no canvas backend, so `ImageData` is undefined. The picker's
// blit helper constructs one; provide a minimal stand-in (real browsers and
// the workbench build have the genuine global).
if (typeof globalThis.ImageData === "undefined") {
  class ImageDataPolyfill {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    colorSpace: PredefinedColorSpace;
    constructor(
      data: Uint8ClampedArray,
      width: number,
      height: number,
      settings?: ImageDataSettings,
    ) {
      this.data = data;
      this.width = width;
      this.height = height;
      this.colorSpace = settings?.colorSpace ?? "srgb";
    }
  }
  globalThis.ImageData = ImageDataPolyfill as unknown as typeof ImageData;
}

// jsdom does not implement pointer capture; the L×C pad calls it on drag.
for (const method of [
  "setPointerCapture",
  "releasePointerCapture",
  "hasPointerCapture",
] as const) {
  if (typeof Element.prototype[method] === "undefined") {
    Element.prototype[method] = () => {};
  }
}

afterEach(() => {
  cleanup();
});
