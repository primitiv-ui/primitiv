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

// The clone buffer is BUFFER_PERIODS copies deep at each end, so resolve slide
// roles by DOM position instead of a fixed index (keeps these tests correct for
// any buffer depth): the real slides carry no `data-clone-of`; the "nearest
// trailing" clone of an index is the first clone-of-index that follows the real
// slides in DOM order (exactly one period away — the copy the recentre teleports
// from).
function slideRoles(container: HTMLElement) {
  const slides = Array.from(
    container.querySelectorAll<HTMLElement>("[data-carousel-slide]"),
  );
  const reals = slides.filter((s) => !s.hasAttribute("data-clone-of"));
  const firstTrailingCloneOf = (index: number) =>
    slides.find(
      (s) =>
        s.getAttribute("data-clone-of") === String(index) &&
        reals[0]!.compareDocumentPosition(s) &
          Node.DOCUMENT_POSITION_FOLLOWING,
    )!;
  return { slides, reals, firstTrailingCloneOf };
}

// Mock every slide's leading edge on `axis` by its DOM order, anchored so
// `anchor` sits at 0 with a fixed 500px pitch. A whole period spans the real set
// (two slides → 1000), so e.g. anchoring the trailing clone of 0 at 0 puts real
// slide 0 at −1000 — the one-period offset the recentre teleports by.
function mockEdgesAnchored(
  container: HTMLElement,
  viewport: HTMLElement,
  anchor: HTMLElement,
  axis: Axis,
) {
  const slides = Array.from(
    container.querySelectorAll<HTMLElement>("[data-carousel-slide]"),
  );
  const anchorIndex = slides.indexOf(anchor);
  const map = new Map<Element, number>([[viewport, 0]]);
  slides.forEach((slide, i) => map.set(slide, (i - anchorIndex) * 500));
  mockEdges(map, axis);
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
  const { slides, reals, firstTrailingCloneOf } = slideRoles(result.container);
  return {
    ...result,
    viewport,
    slides,
    real0: reals[0]!,
    real1: reals[1]!,
    trail0: firstTrailingCloneOf(0),
    trail1: firstTrailingCloneOf(1),
  };
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
    const { viewport, container, trail0 } = renderInfinite();
    trackScroll(viewport, "scrollLeft");
    // Scrolled so the trailing clone of slide 0 sits at the viewport start;
    // its real counterpart is one period (1000) to the left.
    mockEdgesAnchored(container, viewport, trail0, "left");

    fireScrollEnd(viewport);

    // delta = real0.left(-1000) - trail0.left(0) = -1000.
    expect(viewport.scrollLeft).toBe(-1000);
  });

  it("should prefer the browser's snap target over a geometry guess", () => {
    const { viewport, container, real0, trail0 } = renderInfinite();
    trackScroll(viewport, "scrollLeft");
    // Geometry would pick a REAL slide as nearest (→ no-op), but the browser
    // actually snapped to the trailing clone of slide 0. The recentre must
    // trust the snap target, not the geometry guess. Anchoring real0 at 0 makes
    // it the geometry-nearest, with the trailing clone one period (1000) away.
    mockEdgesAnchored(container, viewport, real0, "left");
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
    const { viewport, container, trail0 } = renderInfinite();
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
    mockEdgesAnchored(container, viewport, trail0, "left");

    fireScrollEnd(viewport);

    // The jump happened with both suppressed (so it's instant, not animated)…
    expect(behaviorAtWrite).toBe("auto");
    expect(snapAtWrite).toBe("none");
    // …and both are restored on the next frame (rAF flushed in beforeEach).
    expect(viewport.style.scrollBehavior).toBe("smooth");
    expect(viewport.style.scrollSnapType).toBe("x mandatory");
  });

  it("should not teleport when the scroll settles on a real slide", () => {
    const { viewport, container, real0 } = renderInfinite();
    trackScroll(viewport, "scrollLeft");
    // real-0 is at the viewport start (home) — nothing to recentre.
    mockEdgesAnchored(container, viewport, real0, "left");

    fireScrollEnd(viewport);

    expect(viewport.scrollLeft).toBe(0);
  });

  it("should recentre on the block axis when the carousel is vertical", () => {
    const { viewport, container, trail0 } = renderInfinite("vertical");
    trackScroll(viewport, "scrollTop");
    mockEdgesAnchored(container, viewport, trail0, "top");

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
    const { viewport, trail1, container } = renderInfinite();
    // Snapping onto the trailing clone of slide 1 (data-clone-of="1") must
    // advance the active page to 1, so the real slide 1 becomes active even
    // though the pixels are showing the clone (the recentre then teleports).
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
