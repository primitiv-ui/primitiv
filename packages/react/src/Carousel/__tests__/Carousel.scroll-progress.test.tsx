import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";

import { MockResizeObserver } from "../../test/resizeObserverPolyfill";
import { Carousel } from "../index.ts";
import type { CarouselImperativeApi } from "../index.ts";

function fixture(
  apiRef: React.Ref<CarouselImperativeApi>,
  props: { orientation?: "horizontal" | "vertical" } = {},
) {
  return (
    <Carousel.Root ref={apiRef} ariaLabel="Featured products" {...props}>
      <Carousel.Viewport data-testid="viewport">
        <Carousel.Slide data-testid="slide-0" />
        <Carousel.Slide data-testid="slide-1" />
        <Carousel.Slide data-testid="slide-2" />
      </Carousel.Viewport>
    </Carousel.Root>
  );
}

function mockHorizontalScrollGeometry(
  el: HTMLElement,
  { scrollLeft = 0, scrollWidth = 0, clientWidth = 0 },
) {
  Object.defineProperty(el, "scrollLeft", {
    value: scrollLeft,
    configurable: true,
  });
  Object.defineProperty(el, "scrollWidth", {
    value: scrollWidth,
    configurable: true,
  });
  Object.defineProperty(el, "clientWidth", {
    value: clientWidth,
    configurable: true,
  });
}

function mockVerticalScrollGeometry(
  el: HTMLElement,
  { scrollTop = 0, scrollHeight = 0, clientHeight = 0 },
) {
  Object.defineProperty(el, "scrollTop", {
    value: scrollTop,
    configurable: true,
  });
  Object.defineProperty(el, "scrollHeight", {
    value: scrollHeight,
    configurable: true,
  });
  Object.defineProperty(el, "clientHeight", {
    value: clientHeight,
    configurable: true,
  });
}

describe("Carousel imperative getScrollProgress", () => {
  it("returns 0 when there is no scrollable overflow", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(fixture(ref));

    expect(ref.current!.getScrollProgress()).toBe(0);
  });

  it("reflects scrollLeft/scrollWidth/clientWidth after a scroll event (horizontal)", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(fixture(ref));
    const viewport = screen.getByTestId("viewport");

    mockHorizontalScrollGeometry(viewport, {
      scrollLeft: 150,
      scrollWidth: 900,
      clientWidth: 300,
    });

    act(() => {
      viewport.dispatchEvent(new Event("scroll"));
    });

    // maxScroll = 900 - 300 = 600; 150 / 600 = 0.25
    expect(ref.current!.getScrollProgress()).toBe(0.25);
  });

  it("reflects scrollTop/scrollHeight/clientHeight when orientation is vertical", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(fixture(ref, { orientation: "vertical" }));
    const viewport = screen.getByTestId("viewport");

    mockVerticalScrollGeometry(viewport, {
      scrollTop: 100,
      scrollHeight: 500,
      clientHeight: 200,
    });

    act(() => {
      viewport.dispatchEvent(new Event("scroll"));
    });

    // maxScroll = 500 - 200 = 300; 100 / 300 = 1/3
    expect(ref.current!.getScrollProgress()).toBeCloseTo(1 / 3);
  });

  it("returns 0 when maxScroll is not positive (no overflow to scroll)", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(fixture(ref));
    const viewport = screen.getByTestId("viewport");

    mockHorizontalScrollGeometry(viewport, {
      scrollLeft: 0,
      scrollWidth: 300,
      clientWidth: 300,
    });

    act(() => {
      viewport.dispatchEvent(new Event("scroll"));
    });

    expect(ref.current!.getScrollProgress()).toBe(0);
  });

  it("clamps to 1 when scrollLeft exceeds maxScroll", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(fixture(ref));
    const viewport = screen.getByTestId("viewport");

    mockHorizontalScrollGeometry(viewport, {
      scrollLeft: 9999,
      scrollWidth: 900,
      clientWidth: 300,
    });

    act(() => {
      viewport.dispatchEvent(new Event("scroll"));
    });

    expect(ref.current!.getScrollProgress()).toBe(1);
  });

  it("treats a negative scrollLeft (the standardized RTL convention) as forward progress via Math.abs", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(fixture(ref));
    const viewport = screen.getByTestId("viewport");

    mockHorizontalScrollGeometry(viewport, {
      scrollLeft: -450,
      scrollWidth: 900,
      clientWidth: 300,
    });

    act(() => {
      viewport.dispatchEvent(new Event("scroll"));
    });

    // maxScroll = 600; |-450| / 600 = 0.75
    expect(ref.current!.getScrollProgress()).toBe(0.75);
  });

  it("mirrors the value onto the viewport's --carousel-progress custom property", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(fixture(ref));
    const viewport = screen.getByTestId("viewport");

    mockHorizontalScrollGeometry(viewport, {
      scrollLeft: 300,
      scrollWidth: 900,
      clientWidth: 300,
    });

    act(() => {
      viewport.dispatchEvent(new Event("scroll"));
    });

    expect(viewport.style.getPropertyValue("--carousel-progress")).toBe("0.5");
  });

  it("computes the value once synchronously on mount, before any scroll event", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(fixture(ref));
    const viewport = screen.getByTestId("viewport");

    // Geometry mocked with defineProperty before render would be racier to
    // set up; instead confirm the mount-time call by asserting the CSS var
    // is already present (not just unset) immediately after render, using
    // whatever the default (zero-overflow) geometry resolves to.
    expect(viewport.style.getPropertyValue("--carousel-progress")).toBe("0");
  });

  it("removes the scroll listener on unmount", () => {
    const ref = createRef<CarouselImperativeApi>();
    const { unmount } = render(fixture(ref));
    const viewport = screen.getByTestId("viewport");
    const removeSpy = vi.spyOn(viewport, "removeEventListener");

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
  });
});

describe("Carousel imperative getSlideProgress", () => {
  function mockRects(rectsByTestId: Record<string, Partial<DOMRect>>) {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const rect = rectsByTestId[this.dataset.testid ?? ""];
        return { left: 0, top: 0, width: 0, height: 0, ...rect } as DOMRect;
      },
    );
  }

  it("returns 0 for a never-registered/out-of-range index", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(fixture(ref));

    expect(ref.current!.getSlideProgress(99)).toBe(0);
  });

  it("returns 0 for a slide centered in the viewport", () => {
    const ref = createRef<CarouselImperativeApi>();
    mockRects({
      viewport: { left: 0, width: 300 },
      "slide-0": { left: 75, width: 150 },
    });
    render(fixture(ref));

    expect(ref.current!.getSlideProgress(0)).toBe(0);
  });

  it("is negative when the slide's center sits before the viewport's center", () => {
    const ref = createRef<CarouselImperativeApi>();
    mockRects({
      viewport: { left: 0, width: 300 },
      "slide-0": { left: 0, width: 150 },
    });
    render(fixture(ref));

    // slideCenter=75, viewportCenter=150, halfSize=150 -> (75-150)/150 = -0.5
    expect(ref.current!.getSlideProgress(0)).toBeCloseTo(-0.5);
  });

  it("is positive when the slide's center sits after the viewport's center", () => {
    const ref = createRef<CarouselImperativeApi>();
    mockRects({
      viewport: { left: 0, width: 300 },
      "slide-0": { left: 150, width: 150 },
    });
    render(fixture(ref));

    // slideCenter=225, viewportCenter=150, halfSize=150 -> (225-150)/150 = 0.5
    expect(ref.current!.getSlideProgress(0)).toBeCloseTo(0.5);
  });

  it("clamps to -1/+1 at or beyond the viewport edge", () => {
    const ref = createRef<CarouselImperativeApi>();
    mockRects({
      viewport: { left: 0, width: 300 },
      "slide-0": { left: -1000, width: 150 },
      "slide-1": { left: 1000, width: 150 },
    });
    render(fixture(ref));

    expect(ref.current!.getSlideProgress(0)).toBe(-1);
    expect(ref.current!.getSlideProgress(1)).toBe(1);
  });

  it("uses vertical geometry (top/height) when orientation is vertical", () => {
    const ref = createRef<CarouselImperativeApi>();
    mockRects({
      viewport: { top: 0, height: 300 },
      "slide-0": { top: 150, height: 150 },
    });
    render(fixture(ref, { orientation: "vertical" }));

    // slideCenter=225, viewportCenter=150, halfSize=150 -> 0.5
    expect(ref.current!.getSlideProgress(0)).toBeCloseTo(0.5);
  });

  it("returns 0 when the viewport's half-extent is 0 (defensive divide-by-zero guard)", () => {
    const ref = createRef<CarouselImperativeApi>();
    mockRects({
      viewport: { left: 0, width: 0 },
      "slide-0": { left: 50, width: 100 },
    });
    render(fixture(ref));

    expect(ref.current!.getSlideProgress(0)).toBe(0);
  });

  it("mirrors each slide's value onto its own --slide-progress custom property", () => {
    const ref = createRef<CarouselImperativeApi>();
    mockRects({
      viewport: { left: 0, width: 300 },
      "slide-0": { left: 150, width: 150 },
    });
    render(fixture(ref));

    expect(
      screen.getByTestId("slide-0").style.getPropertyValue("--slide-progress"),
    ).toBe("0.5");
  });

  it("computes slide progress once synchronously on mount, with no scroll/resize event", () => {
    const ref = createRef<CarouselImperativeApi>();
    mockRects({
      viewport: { left: 0, width: 300 },
      "slide-0": { left: 150, width: 150 },
    });
    render(fixture(ref));

    expect(
      screen.getByTestId("slide-0").style.getPropertyValue("--slide-progress"),
    ).toBe("0.5");
  });

  it("recomputes both global and per-slide progress when the ResizeObserver fires, without a scroll event", () => {
    const ref = createRef<CarouselImperativeApi>();
    mockRects({
      viewport: { left: 0, width: 300 },
      "slide-0": { left: 75, width: 150 },
    });
    render(fixture(ref));

    expect(ref.current!.getSlideProgress(0)).toBe(0);

    mockRects({
      viewport: { left: 0, width: 300 },
      "slide-0": { left: 150, width: 150 },
    });

    act(() => {
      MockResizeObserver.fireAll();
    });

    expect(ref.current!.getSlideProgress(0)).toBeCloseTo(0.5);
  });

  it("disconnects the ResizeObserver on unmount", () => {
    const ref = createRef<CarouselImperativeApi>();
    const { unmount } = render(fixture(ref));
    const disconnectSpy = vi.spyOn(MockResizeObserver.latest!, "disconnect");

    unmount();

    expect(disconnectSpy).toHaveBeenCalled();
  });
});

describe("Carousel scroll-progress freshness across slide-set changes", () => {
  function mockRects(rectsByTestId: Record<string, Partial<DOMRect>>) {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const rect = rectsByTestId[this.dataset.testid ?? ""];
        return { left: 0, top: 0, width: 0, height: 0, ...rect } as DOMRect;
      },
    );
  }

  it("recomputes immediately when a leading slide is removed and every later slide's index shifts", () => {
    // Without `slideKeys` in the effect's dependency array, removing
    // slide-a would leave index 0's cached progress pinned to slide-a's
    // stale value even though slide-b now occupies index 0 — this test
    // fails silently (wrong number, not a crash) if that freshness fix
    // regresses.
    mockRects({
      viewport: { left: 0, width: 300 },
      "slide-a": { left: 0, width: 100 }, // center 50 -> progress -2/3
      "slide-b": { left: 100, width: 100 }, // center 150 -> progress 0
    });

    const ref = createRef<CarouselImperativeApi>();
    const { rerender } = render(
      <Carousel.Root ariaLabel="Featured products" ref={ref}>
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-a" />
          <Carousel.Slide data-testid="slide-b" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(ref.current!.getSlideProgress(0)).toBeCloseTo(-2 / 3);
    expect(ref.current!.getSlideProgress(1)).toBe(0);

    rerender(
      <Carousel.Root ariaLabel="Featured products" ref={ref}>
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-b" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    // slide-b is now index 0 — its own (unchanged) geometry still gives 0,
    // proving the value was recomputed against the new mapping rather than
    // left as slide-a's stale -2/3 at index 0.
    expect(ref.current!.getSlideProgress(0)).toBe(0);
  });
});
