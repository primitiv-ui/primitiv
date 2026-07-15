import { act, render } from "@testing-library/react";

import { Carousel } from "../index.ts";

// The infinite-loop recentre is real-browser geometry — jsdom reports zeroed
// layout — so these tests mock getBoundingClientRect per element instance
// (clones share the real slide's test id, so a test-id key can't tell them
// apart) to drive the control flow: the teleport fires only when the scroll
// settles on a clone, by the clone→real offset, with snap-type suppressed and
// restored. Pixel-exactness is verified for feel on a real device.

type Axis = "left" | "top";

/** Mock each element's leading edge on the given axis, keyed by instance. */
function mockEdges(map: Map<Element, number>, axis: Axis) {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      const edge = map.get(this) ?? 0;
      return {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        right: 0,
        bottom: 0,
        [axis]: edge,
      } as unknown as DOMRect;
    },
  );
}

/** Make scrollLeft/scrollTop a real read/write property (jsdom leaves them 0). */
function trackScroll(el: HTMLElement, prop: "scrollLeft" | "scrollTop") {
  let value = 0;
  Object.defineProperty(el, prop, {
    configurable: true,
    get: () => value,
    set: (v: number) => {
      value = v;
    },
  });
}

function renderInfinite(
  orientation: "horizontal" | "vertical" = "horizontal",
  loop: boolean | "wrap" | "infinite" = "infinite",
) {
  const result = render(
    <Carousel.Root
      ariaLabel="Featured products"
      loop={loop}
      orientation={orientation}
    >
      <Carousel.Viewport data-testid="viewport">
        <Carousel.Slide data-testid="slide-0" />
        <Carousel.Slide data-testid="slide-1" />
      </Carousel.Viewport>
      <Carousel.Indicators label="Choose slide" />
    </Carousel.Root>,
  );
  const viewport = result.getByTestId("viewport");
  // DOM order of the six slide elements: lead-0, lead-1, real-0, real-1,
  // trail-0, trail-1 (a full clone copy either side of the two real slides).
  const slides = Array.from(
    result.container.querySelectorAll<HTMLElement>("[data-carousel-slide]"),
  );
  return { ...result, viewport, slides };
}

function fireScrollEnd(viewport: HTMLElement) {
  act(() => {
    viewport.dispatchEvent(new Event("scrollend"));
  });
}

describe("Carousel infinite-loop recentre", () => {
  beforeEach(() => {
    // Flush requestAnimationFrame synchronously so the snap-type restore runs.
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  it("should teleport by the clone→real offset when the scroll settles on a trailing clone", () => {
    const { viewport, slides } = renderInfinite();
    trackScroll(viewport, "scrollLeft");
    // Scrolled so the trailing clone of slide 0 sits at the viewport start;
    // its real counterpart is one period (1000) to the left.
    const [leadA, leadB, real0, real1, trail0, trail1] = slides;
    mockEdges(
      new Map<Element, number>([
        [viewport, 0],
        [leadA, -2000],
        [leadB, -1500],
        [real0, -1000],
        [real1, -500],
        [trail0, 0],
        [trail1, 500],
      ]),
      "left",
    );

    fireScrollEnd(viewport);

    // delta = real0.left(-1000) - trail0.left(0) = -1000.
    expect(viewport.scrollLeft).toBe(-1000);
  });

  it("should prefer the browser's snap target over a geometry guess", () => {
    const { viewport, slides } = renderInfinite();
    trackScroll(viewport, "scrollLeft");
    const [leadA, leadB, real0, real1, trail0, trail1] = slides;
    // Geometry would pick a REAL slide as nearest (→ no-op), but the browser
    // actually snapped to the trailing clone of slide 0. The recentre must
    // trust the snap target, not the geometry guess.
    mockEdges(
      new Map<Element, number>([
        [viewport, 0],
        [real0, 0], // nearest by geometry (real → would no-op)
        [trail0, 1000], // the real snap target (a clone)
        [leadA, -2000],
        [leadB, -1500],
        [real1, 500],
        [trail1, 1500],
      ]),
      "left",
    );
    const snap = new Event("scrollsnapchange");
    Object.defineProperty(snap, "snapTargetInline", { value: trail0 });
    act(() => {
      viewport.dispatchEvent(snap);
    });

    fireScrollEnd(viewport);

    // Teleported by trail0→real0 delta = 0 − 1000 = −1000 (used the clone snap
    // target, not the geometry-nearest real slide, which would have no-opped).
    expect(viewport.scrollLeft).toBe(-1000);
  });

  it("should suppress snap-type AND smooth scroll-behavior for the teleport, restoring both next frame", () => {
    const { viewport, slides } = renderInfinite();
    viewport.style.scrollSnapType = "x mandatory";
    // The styled surface sets `scroll-behavior: smooth`; without suppressing
    // it the scrollLeft write animates — the visible "rewind" bug. Capture
    // the values at the moment of the write.
    viewport.style.scrollBehavior = "smooth";
    let behaviorAtWrite: string | undefined;
    let snapAtWrite: string | undefined;
    let value = 0;
    Object.defineProperty(viewport, "scrollLeft", {
      configurable: true,
      get: () => value,
      set: (v: number) => {
        behaviorAtWrite = viewport.style.scrollBehavior;
        snapAtWrite = viewport.style.scrollSnapType;
        value = v;
      },
    });
    const [leadA, leadB, real0, real1, trail0, trail1] = slides;
    mockEdges(
      new Map<Element, number>([
        [viewport, 0],
        [leadA, -2000],
        [leadB, -1500],
        [real0, -1000],
        [real1, -500],
        [trail0, 0],
        [trail1, 500],
      ]),
      "left",
    );

    fireScrollEnd(viewport);

    // The jump happened with both suppressed (so it's instant, not animated)…
    expect(behaviorAtWrite).toBe("auto");
    expect(snapAtWrite).toBe("none");
    // …and both are restored on the next frame (rAF flushed in beforeEach).
    expect(viewport.style.scrollBehavior).toBe("smooth");
    expect(viewport.style.scrollSnapType).toBe("x mandatory");
  });

  it("should not teleport when the scroll settles on a real slide", () => {
    const { viewport, slides } = renderInfinite();
    trackScroll(viewport, "scrollLeft");
    const [leadA, leadB, real0, real1, trail0, trail1] = slides;
    // real-0 is at the viewport start (home) — nothing to recentre.
    mockEdges(
      new Map<Element, number>([
        [viewport, 0],
        [leadA, -1000],
        [leadB, -500],
        [real0, 0],
        [real1, 500],
        [trail0, 1000],
        [trail1, 1500],
      ]),
      "left",
    );

    fireScrollEnd(viewport);

    expect(viewport.scrollLeft).toBe(0);
  });

  it("should recentre on the block axis when the carousel is vertical", () => {
    const { viewport, slides } = renderInfinite("vertical");
    trackScroll(viewport, "scrollTop");
    const [leadA, leadB, real0, real1, trail0, trail1] = slides;
    mockEdges(
      new Map<Element, number>([
        [viewport, 0],
        [leadA, -2000],
        [leadB, -1500],
        [real0, -1000],
        [real1, -500],
        [trail0, 0],
        [trail1, 500],
      ]),
      "top",
    );

    fireScrollEnd(viewport);

    expect(viewport.scrollTop).toBe(-1000);
  });

  it("should not wire the recentre for a non-infinite loop", () => {
    const { viewport, slides } = renderInfinite("horizontal", "wrap");
    trackScroll(viewport, "scrollLeft");
    // wrap renders no clones, but even a stray settle must never teleport.
    mockEdges(new Map<Element, number>([[viewport, 0]]), "left");
    void slides;

    fireScrollEnd(viewport);

    expect(viewport.scrollLeft).toBe(0);
  });

  it("should map a clone snap target to its real page so swiping into the buffer still tracks", () => {
    const { viewport, slides, container } = renderInfinite();
    // Snapping onto the trailing clone of slide 1 (data-clone-of="1") must
    // advance the active page to 1, so the real slide 1 becomes active even
    // though the pixels are showing the clone (the recentre then teleports).
    const trail1 = slides[5];
    const event = new Event("scrollsnapchange");
    Object.defineProperty(event, "snapTargetInline", {
      value: trail1,
      writable: false,
    });

    act(() => {
      viewport.dispatchEvent(event);
    });

    const realSlide1 = container.querySelector(
      '[data-testid="slide-1"]:not([data-carousel-clone])',
    );
    expect(realSlide1).toHaveAttribute("data-state", "active");
  });

  it("should no-op on scrollend when there are no slides at all", () => {
    const result = render(
      <Carousel.Root ariaLabel="Featured products" loop="infinite">
        <Carousel.Viewport data-testid="viewport" />
      </Carousel.Root>,
    );
    const viewport = result.getByTestId("viewport");
    trackScroll(viewport, "scrollLeft");

    // No throw, no teleport.
    fireScrollEnd(viewport);

    expect(viewport.scrollLeft).toBe(0);
  });
});
