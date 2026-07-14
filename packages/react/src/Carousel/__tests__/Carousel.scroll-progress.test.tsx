import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";

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
