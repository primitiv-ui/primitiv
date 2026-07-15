import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel } from "../index.ts";

// The infinite forward/backward glide: a wrap (last↔first) via next()/previous()
// scrolls into the *adjacent clone* (one step) rather than rewinding across the
// whole track. Geometry is real-browser-only, so these drive the control flow
// with per-instance mocked rects and assert which element the programmatic
// scroll targets (its position), plus that the first infinite scroll is instant.

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
  it("should glide forward into the trailing clone when Next wraps past the end", async () => {
    const user = userEvent.setup();
    const ctx = renderInfinite(1); // start on the last page
    const scrollTo = vi.spyOn(ctx.viewport, "scrollTo");
    mockLefts(
      new Map<Element, number>([
        [ctx.viewport, 0],
        [ctx.real0, -1000], // rewinding here would scroll backward
        [ctx.trail0, 1000], // the trailing clone is forward (to the right)
      ]),
    );

    await user.click(ctx.getByRole("button", { name: "Next" }));

    // start alignment → position === target.left. Forward glide targets the
    // trailing clone at +1000, not the real slide 0 at −1000.
    expect(scrollTo).toHaveBeenLastCalledWith(
      expect.objectContaining({ left: 1000 }),
    );
  });

  it("should glide backward into the leading clone when Previous wraps past the start", async () => {
    const user = userEvent.setup();
    const ctx = renderInfinite(0); // start on the first page
    const scrollTo = vi.spyOn(ctx.viewport, "scrollTo");
    mockLefts(
      new Map<Element, number>([
        [ctx.viewport, 0],
        [ctx.real1, 1000], // rewinding here would scroll forward
        [ctx.leadB, -1000], // the leading clone of slide 1 is backward
      ]),
    );

    await user.click(ctx.getByRole("button", { name: "Previous" }));

    expect(scrollTo).toHaveBeenLastCalledWith(
      expect.objectContaining({ left: -1000 }),
    );
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
});
