import { render, screen } from "@testing-library/react";

import { Carousel } from "../index.ts";

// A carousel's slide count and layout counts come from the consumer, so a
// bad slidesPerPage / slidesPerMove (0, negative, NaN, fractional) must
// degrade gracefully to a sane integer ≥ 1 rather than dividing by zero
// (Infinity pages → a thrown RangeError from the indicator map) or going
// silently inert.
describe("Carousel multi-slide input guards", () => {
  it("should treat slidesPerPage < 1 as 1 rather than dividing by zero", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" slidesPerPage={0}>
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.Indicators label="Choose page" />
      </Carousel.Root>,
    );

    // perPage coerced to 1 → one page per slide → 4 indicators.
    expect(
      screen.getAllByRole("button", { name: /^Slide \d+$/ }),
    ).toHaveLength(4);
  });

  it("should treat a non-finite slidesPerPage as 1", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" slidesPerPage={NaN}>
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.Indicators label="Choose page" />
      </Carousel.Root>,
    );

    expect(
      screen.getAllByRole("button", { name: /^Slide \d+$/ }),
    ).toHaveLength(3);
  });

  it("should round a fractional slidesPerPage down to an integer", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" slidesPerPage={2.5}>
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.Indicators label="Choose page" />
      </Carousel.Root>,
    );

    // floor(2.5) = 2 → ceil(5 / 2) = 3 pages (an unfloored 2.5 would give
    // ceil(5 / 2.5) = 2, so this pins the integer coercion).
    expect(
      screen.getAllByRole("button", { name: /^Slide \d+$/ }),
    ).toHaveLength(3);
  });

  it("should treat a numeric slidesPerMove < 1 as 1", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        slidesPerPage={2}
        slidesPerMove={0}
      >
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.Indicators label="Choose page" />
      </Carousel.Root>,
    );

    // move coerced to 1 → windows [0,1] [1,2] [2,3] → 3 pages (not the
    // Infinity a move of 0 would divide to).
    expect(
      screen.getAllByRole("button", { name: /^Slide \d+$/ }),
    ).toHaveLength(3);
  });
});
