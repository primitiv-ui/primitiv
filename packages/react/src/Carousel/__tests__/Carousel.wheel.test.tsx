import { act, render, screen } from "@testing-library/react";

import { Carousel } from "../index.ts";

function fireWheel(
  viewport: HTMLElement,
  init: { deltaX?: number; deltaY?: number; deltaMode?: number },
) {
  const event = new WheelEvent("wheel", {
    deltaX: init.deltaX ?? 0,
    deltaY: init.deltaY ?? 0,
    deltaMode: init.deltaMode ?? 0,
    cancelable: true,
    bubbles: true,
  });
  act(() => {
    viewport.dispatchEvent(event);
  });
  return event;
}

// A physical scroll wheel (vertical notches, deltaY only) natively scrolls
// a vertically-scrollable container, so `orientation="vertical"` already
// works with zero custom code. But browsers only auto-translate a plain
// vertical wheel to horizontal scroll when Shift is held — so a horizontal
// (the default) carousel needs the deltaY-to-scrollLeft translation below.
// It must stand down whenever deltaX is real (a trackpad/Magic Mouse
// horizontal swipe already scrolls a horizontal viewport natively via
// deltaX, the same mechanism as touch).
describe("Carousel wheel scrolling", () => {
  it("should translate a vertical wheel notch into horizontal scroll on a horizontal carousel", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "scrollLeft", {
      value: 50,
      writable: true,
    });

    const event = fireWheel(viewport, { deltaY: 30 });

    expect(viewport.scrollLeft).toBe(80);
    expect(event.defaultPrevented).toBe(true);
  });

  it("should not translate when deltaX is already real (a trackpad/Magic Mouse horizontal swipe already scrolls natively)", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "scrollLeft", {
      value: 50,
      writable: true,
    });

    const event = fireWheel(viewport, { deltaX: 20, deltaY: 5 });

    expect(viewport.scrollLeft).toBe(50);
    expect(event.defaultPrevented).toBe(false);
  });

  it("should not translate on a vertical carousel — native vertical scroll already handles it", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" orientation="vertical">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "scrollLeft", {
      value: 50,
      writable: true,
    });

    const event = fireWheel(viewport, { deltaY: 30 });

    expect(viewport.scrollLeft).toBe(50);
    expect(event.defaultPrevented).toBe(false);
  });

  it("should scale a DOM_DELTA_LINE wheel event to pixels before translating", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "scrollLeft", {
      value: 0,
      writable: true,
    });

    // deltaMode 1 = DOM_DELTA_LINE — 1 line scales to 16px.
    fireWheel(viewport, { deltaY: 1, deltaMode: 1 });

    expect(viewport.scrollLeft).toBe(16);
  });

  it("should scale a DOM_DELTA_PAGE wheel event by the viewport width before translating", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "scrollLeft", {
      value: 0,
      writable: true,
    });
    Object.defineProperty(viewport, "clientWidth", {
      value: 320,
      configurable: true,
    });

    // deltaMode 2 = DOM_DELTA_PAGE — 1 page scales to the viewport width.
    fireWheel(viewport, { deltaY: 1, deltaMode: 2 });

    expect(viewport.scrollLeft).toBe(320);
  });

  it("should not translate when transition is not 'slide'", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" transition="fade">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "scrollLeft", {
      value: 50,
      writable: true,
    });

    const event = fireWheel(viewport, { deltaY: 30 });

    expect(viewport.scrollLeft).toBe(50);
    expect(event.defaultPrevented).toBe(false);
  });
});
