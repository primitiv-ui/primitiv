import { render, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel } from "../index.ts";

// The infinite transform engine (RFC 0018 / useCarouselLoop). Real geometry is
// browser-only (jsdom lays nothing out), so these mock the layout the engine
// reads (offsetLeft/Top, offsetWidth/Height, clientWidth/Height) and assert the
// resulting track / per-slide transforms and the CSS transition that drives the
// glide. Pixel behaviour and smoothness are verified in Playwright.

const STRIDE = 100; // slide size + gap
const SLIDE = 100;
const VIEWPORT = 100; // → centre align offset 0, so transforms read cleanly

function defineGeometry() {
  // A slide's layout position is its index × stride; every slide is SLIDE wide;
  // the viewport is VIEWPORT wide. Defined on the prototype so both axes read
  // the same numbers (horizontal uses left/width, vertical top/height).
  const indexPos = function (this: HTMLElement) {
    const index = this.getAttribute?.("data-index");
    return index != null ? Number(index) * STRIDE : 0;
  };
  const slideSize = function (this: HTMLElement) {
    return this.hasAttribute?.("data-carousel-slide") ? SLIDE : 0;
  };
  const viewportSize = function (this: HTMLElement) {
    return this.hasAttribute?.("data-carousel-viewport") ? VIEWPORT : 0;
  };
  for (const [prop, get] of [
    ["offsetLeft", indexPos],
    ["offsetTop", indexPos],
    ["offsetWidth", slideSize],
    ["offsetHeight", slideSize],
    ["clientWidth", viewportSize],
    ["clientHeight", viewportSize],
  ] as const) {
    Object.defineProperty(HTMLElement.prototype, prop, {
      configurable: true,
      get,
    });
  }
}

beforeEach(() => {
  defineGeometry();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  for (const prop of [
    "offsetLeft",
    "offsetTop",
    "offsetWidth",
    "offsetHeight",
    "clientWidth",
    "clientHeight",
  ]) {
    delete (HTMLElement.prototype as unknown as Record<string, unknown>)[prop];
  }
});

function renderInfinite(
  props: Partial<{
    loop: "infinite" | "wrap";
    orientation: "horizontal" | "vertical";
    snapAlign: "start" | "center" | "end";
    defaultPage: number;
    count: number;
  }> = {},
) {
  const {
    loop = "infinite",
    orientation = "horizontal",
    snapAlign = "center",
    defaultPage = 0,
    count = 4,
  } = props;
  const result = render(
    <Carousel.Root
      ariaLabel="Featured products"
      loop={loop}
      orientation={orientation}
      snapAlign={snapAlign}
      defaultPage={defaultPage}
    >
      <Carousel.Viewport data-testid="viewport">
        {Array.from({ length: count }).map((_, i) => (
          <Carousel.Slide key={i} data-testid={`slide-${i}`} />
        ))}
      </Carousel.Viewport>
      <Carousel.PreviousTrigger>Previous</Carousel.PreviousTrigger>
      <Carousel.NextTrigger>Next</Carousel.NextTrigger>
    </Carousel.Root>,
  );
  const track = result.container.querySelector<HTMLElement>(
    "[data-carousel-track]",
  );
  return { ...result, track };
}

describe("Carousel infinite — transform engine", () => {
  it("wraps the slides in a track for infinite, and not for other modes", () => {
    const infinite = renderInfinite({ loop: "infinite" });
    expect(infinite.track).not.toBeNull();
    expect(
      infinite.track!.querySelectorAll("[data-carousel-slide]"),
    ).toHaveLength(4);

    const wrap = renderInfinite({ loop: "wrap" });
    expect(wrap.track).toBeNull();
  });

  it("positions the track on the active page at rest, instantly (no glide on load)", () => {
    const { track } = renderInfinite({ snapAlign: "center" });
    // align (VIEWPORT−SLIDE)/2 = 0, offset 0 → translate3d(0). First paint is
    // instant, so no transition.
    expect(track!.style.transform).toBe("translate3d(0px, 0px, 0px)");
    expect(track!.style.transition).toBe("none");
  });

  it("glides forward one stride via a CSS transition when Next advances a page", async () => {
    const user = userEvent.setup();
    const { track, getByRole } = renderInfinite();

    await user.click(getByRole("button", { name: "Next" }));

    // Page 0 → 1: offset 1×stride = 100 → translate3d(align − 100) = −100, driven
    // by a transform transition (the smooth, GPU-composited glide).
    expect(track!.style.transform).toBe("translate3d(-100px, 0px, 0px)");
    expect(track!.style.transition).toContain("transform");
  });

  it("wraps the SHORT way from the last page to the first (no rewind)", async () => {
    const user = userEvent.setup();
    // 4 slides, start on the last. slide 3 is one step *back* from slide 0, so it
    // rests at offset −100 (translate3d(align − (−100)) = 100).
    const { track, getByRole } = renderInfinite({ defaultPage: 3 });
    expect(track!.style.transform).toBe("translate3d(100px, 0px, 0px)");

    await user.click(getByRole("button", { name: "Next" }));

    // 3 → 0 is +1 forward: offset −100 → 0, a single step onward (no rewind).
    expect(track!.style.transform).toBe("translate3d(0px, 0px, 0px)");
  });

  it("gives an off-screen slide a wrapShift so a copy fills the seam", () => {
    const { getByTestId } = renderInfinite({ defaultPage: 3 });

    // At page 3 (offset −100) slide 3's flex position (300) would sit off the
    // right (track translate +100 → 400); a wrapShift of −trackLength (−400)
    // pulls its copy back under the viewport — the clone-free seam fill.
    const slide3 = getByTestId("slide-3");
    expect(slide3.style.transform).toBe("translate3d(-400px, 0px, 0px)");
  });

  it("jumps instantly with no transition under reduced motion", async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const user = userEvent.setup();
    const { track, getByRole } = renderInfinite();

    await user.click(getByRole("button", { name: "Next" }));

    expect(track!.style.transform).toBe("translate3d(-100px, 0px, 0px)");
    expect(track!.style.transition).toBe("none");
  });

  it("drives the block axis for a vertical infinite loop", async () => {
    const user = userEvent.setup();
    const { track, getByRole } = renderInfinite({ orientation: "vertical" });

    await user.click(getByRole("button", { name: "Next" }));

    expect(track!.style.transform).toBe("translate3d(0px, -100px, 0px)");
  });

  it("offsets the track for start and end alignment", () => {
    // Widen the viewport so alignment is visible: redefine clientWidth to 300.
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get(this: HTMLElement) {
        return this.hasAttribute?.("data-carousel-viewport") ? 300 : 0;
      },
    });
    const start = renderInfinite({ snapAlign: "start" });
    // start align = 0 → translate3d(0).
    expect(start.track!.style.transform).toBe("translate3d(0px, 0px, 0px)");

    const end = renderInfinite({ snapAlign: "end" });
    // end align = viewport(300) − slide(100) = 200 → translate3d(200).
    expect(end.track!.style.transform).toBe("translate3d(200px, 0px, 0px)");
  });

  it("does nothing when there are too few slides to loop", () => {
    const { track } = renderInfinite({ count: 1 });
    // measure() bails (count < 2) — the track renders but gets no transform.
    expect(track!.style.transform).toBe("");
  });

  it("does not loop when slides report a zero stride (not yet laid out)", () => {
    // Collapse every slide onto position 0 → stride 0 → measure bails.
    Object.defineProperty(HTMLElement.prototype, "offsetLeft", {
      configurable: true,
      get: () => 0,
    });
    const { track } = renderInfinite();
    expect(track!.style.transform).toBe("");
  });

  it("re-homes the track without erroring when unmounted mid-interaction", async () => {
    const user = userEvent.setup();
    const { getByRole, unmount } = renderInfinite();
    await user.click(getByRole("button", { name: "Next" }));
    expect(() => act(() => unmount())).not.toThrow();
  });
});
