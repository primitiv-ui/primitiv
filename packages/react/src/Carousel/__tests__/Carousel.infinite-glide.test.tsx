import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel } from "../index.ts";

// The infinite forward/backward glide uses *teleport-then-glide*: a wrap
// (last↔first) via next()/previous() instantly jumps one period to the buffer
// copy behind it, then smooth-scrolls to the *real* target — so it lands on the
// real slide and a rapid follow-up click can't strand it on a clone and rewind.
// Geometry is real-browser-only, so these drive the control flow with mocked
// rects: they assert the one-period teleport (its sign) plus that the first
// infinite scroll is instant.

function mockLefts(map: Map<Element, number>) {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      return {
        left: map.get(this) ?? 0,
        top: 0,
        width: 0,
        height: 0,
        right: 0,
        bottom: 0,
      } as unknown as DOMRect;
    },
  );
}

/** Make scrollLeft a real read/write property (jsdom leaves it 0). */
function trackScroll(el: HTMLElement) {
  let value = 0;
  Object.defineProperty(el, "scrollLeft", {
    configurable: true,
    get: () => value,
    set: (v: number) => {
      value = v;
    },
  });
}

function renderInfinite(defaultPage: number) {
  const result = render(
    <Carousel.Root
      ariaLabel="Featured products"
      loop="infinite"
      snapAlign="start"
      defaultPage={defaultPage}
    >
      <Carousel.Viewport data-testid="viewport">
        <Carousel.Slide data-testid="slide-0" />
        <Carousel.Slide data-testid="slide-1" />
      </Carousel.Viewport>
      <Carousel.PreviousTrigger>Previous</Carousel.PreviousTrigger>
      <Carousel.NextTrigger>Next</Carousel.NextTrigger>
    </Carousel.Root>,
  );
  const viewport = result.getByTestId("viewport");
  // DOM order: lead-0, lead-1, real-0, real-1, trail-0, trail-1.
  const [leadA, leadB, real0, real1, trail0, trail1] = Array.from(
    result.container.querySelectorAll<HTMLElement>("[data-carousel-slide]"),
  );
  return { ...result, viewport, leadA, leadB, real0, real1, trail0, trail1 };
}

describe("Carousel infinite-loop glide", () => {
  it("should teleport back one period then glide to the real slide on a forward wrap", async () => {
    const user = userEvent.setup();
    const ctx = renderInfinite(1); // start on the last page
    trackScroll(ctx.viewport);
    const scrollTo = vi.spyOn(ctx.viewport, "scrollTo");
    // period = trailing-clone-0 − real-0 = 2000.
    mockLefts(
      new Map<Element, number>([
        [ctx.viewport, 0],
        [ctx.real0, 0],
        [ctx.trail0, 2000],
      ]),
    );

    await user.click(ctx.getByRole("button", { name: "Next" }));

    // Jumped back exactly one period (invisible — an identical slide), so the
    // subsequent glide to the real slide runs forward and lands on real.
    expect(ctx.viewport.scrollLeft).toBe(-2000);
    expect(scrollTo).toHaveBeenCalled();
  });

  it("should teleport forward one period then glide to the real slide on a backward wrap", async () => {
    const user = userEvent.setup();
    const ctx = renderInfinite(0); // start on the first page
    trackScroll(ctx.viewport);
    const scrollTo = vi.spyOn(ctx.viewport, "scrollTo");
    mockLefts(
      new Map<Element, number>([
        [ctx.viewport, 0],
        [ctx.real0, 0],
        [ctx.trail0, 2000], // period = 2000
      ]),
    );

    await user.click(ctx.getByRole("button", { name: "Previous" }));

    // A backward wrap jumps forward one period so the glide to the real target
    // runs backward and lands on real.
    expect(ctx.viewport.scrollLeft).toBe(2000);
    expect(scrollTo).toHaveBeenCalled();
  });

  it("should target the real slide (no glide) for a normal Next that does not wrap", async () => {
    const user = userEvent.setup();
    const ctx = renderInfinite(0);
    const scrollTo = vi.spyOn(ctx.viewport, "scrollTo");
    mockLefts(
      new Map<Element, number>([
        [ctx.viewport, 0],
        [ctx.real1, 500], // the real slide 1 (normal forward step)
        [ctx.trail1, 9999], // a clone must NOT be chosen here
      ]),
    );

    await user.click(ctx.getByRole("button", { name: "Next" }));

    expect(scrollTo).toHaveBeenLastCalledWith(
      expect.objectContaining({ left: 500 }),
    );
  });

  it("should target the real slide (no glide) for a normal Previous that does not wrap", async () => {
    const user = userEvent.setup();
    const ctx = renderInfinite(1);
    const scrollTo = vi.spyOn(ctx.viewport, "scrollTo");
    mockLefts(
      new Map<Element, number>([
        [ctx.viewport, 0],
        [ctx.real0, 300], // the real slide 0 (normal backward step)
        [ctx.leadA, 9999], // a clone must NOT be chosen here
      ]),
    );

    await user.click(ctx.getByRole("button", { name: "Previous" }));

    expect(scrollTo).toHaveBeenLastCalledWith(
      expect.objectContaining({ left: 300 }),
    );
  });

  it("should position the first infinite scroll instantly (no one-period slide on load)", () => {
    const scrollTo = vi.spyOn(HTMLElement.prototype, "scrollTo");

    renderInfinite(0);

    // The very first programmatic scroll for an infinite carousel is instant.
    expect(scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "instant" }),
    );
  });

  it("should teleport by one full period on a multi-slide wrap so the glide lands on the real page", async () => {
    const user = userEvent.setup();
    // 4 slides, 2 per page → pages [0,1] and [2,3]. Start on the last page.
    const result = render(
      <Carousel.Root
        ariaLabel="Featured products"
        loop="infinite"
        snapAlign="start"
        slidesPerPage={2}
        defaultPage={1}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
          <Carousel.Slide data-testid="slide-3" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );
    const viewport = result.getByTestId("viewport");
    trackScroll(viewport);
    // DOM: lead-0..3, real-0..3, trail-0..3. The period is one full copy
    // (real-0 → its trailing clone), which spans all four slides.
    const slideEls = Array.from(
      result.container.querySelectorAll<HTMLElement>("[data-carousel-slide]"),
    );
    const real0 = slideEls[4];
    const trail0 = slideEls[8];
    const scrollTo = vi.spyOn(viewport, "scrollTo");
    mockLefts(
      new Map<Element, number>([
        [viewport, 0],
        [real0, 0],
        [trail0, 4000], // one full 4-slide period
      ]),
    );

    await user.click(result.getByRole("button", { name: "Next" }));

    // Forward wrap → jump back one full period; the glide then lands on the
    // real first page.
    expect(viewport.scrollLeft).toBe(-4000);
    expect(scrollTo).toHaveBeenCalled();
  });

  it("should teleport on the block axis for a vertical wrap", async () => {
    const user = userEvent.setup();
    const result = render(
      <Carousel.Root
        ariaLabel="Featured products"
        loop="infinite"
        snapAlign="start"
        orientation="vertical"
        defaultPage={1}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );
    const viewport = result.getByTestId("viewport");
    let top = 0;
    Object.defineProperty(viewport, "scrollTop", {
      configurable: true,
      get: () => top,
      set: (v: number) => {
        top = v;
      },
    });
    const slideEls = Array.from(
      result.container.querySelectorAll<HTMLElement>("[data-carousel-slide]"),
    );
    const real0 = slideEls[2];
    const trail0 = slideEls[4];
    // Vertical → the period is measured on the block (top) axis.
    const tops = new Map<Element, number>([
      [viewport, 0],
      [real0, 0],
      [trail0, 2000],
    ]);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        return {
          left: 0,
          top: tops.get(this) ?? 0,
          width: 0,
          height: 0,
          right: 0,
          bottom: 0,
        } as unknown as DOMRect;
      },
    );
    const scrollTo = vi.spyOn(viewport, "scrollTo");

    await user.click(result.getByRole("button", { name: "Next" }));

    expect(viewport.scrollTop).toBe(-2000);
    expect(scrollTo).toHaveBeenCalled();
  });
});
