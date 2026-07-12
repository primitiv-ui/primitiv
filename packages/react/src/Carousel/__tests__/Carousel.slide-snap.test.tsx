import { render, screen } from "@testing-library/react";

import { Carousel } from "../index.ts";

// scroll-snap-align must only land on a page's *leading* slide when
// slidesPerPage > 1 — an interior slide is not a valid resting position,
// since the browser's mandatory snap would stop there and leave the
// viewport showing a straddled mix of two pages while currentPage/the
// indicators still claim a single clean page is active (the mouse-wheel /
// drag desync). data-snap-start is the CSS hook the registry stylesheet
// scopes scroll-snap-align to.
describe("Carousel slide snap-start hook", () => {
  it("should mark every slide as a snap start when slidesPerPage is 1 (default)", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(screen.getByTestId("slide-0")).toHaveAttribute("data-snap-start", "");
    expect(screen.getByTestId("slide-1")).toHaveAttribute("data-snap-start", "");
    expect(screen.getByTestId("slide-2")).toHaveAttribute("data-snap-start", "");
  });

  it("should only mark page-start slides when slidesPerPage > 1 (clean paging)", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" slidesPerPage={2}>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
          <Carousel.Slide data-testid="slide-3" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(screen.getByTestId("slide-0")).toHaveAttribute("data-snap-start", "");
    expect(screen.getByTestId("slide-1")).not.toHaveAttribute("data-snap-start");
    expect(screen.getByTestId("slide-2")).toHaveAttribute("data-snap-start", "");
    expect(screen.getByTestId("slide-3")).not.toHaveAttribute("data-snap-start");
  });

  it("should mark the end-aligned last page's leading slide, even off the move step (uneven last page)", () => {
    // perPage 2, 5 slides: offsets 0, 2, 3 (end-aligned) — slide 4 is never
    // a page start (it only ever appears as page 2's *trailing* slide).
    render(
      <Carousel.Root ariaLabel="Featured products" slidesPerPage={2}>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
          <Carousel.Slide data-testid="slide-3" />
          <Carousel.Slide data-testid="slide-4" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(screen.getByTestId("slide-0")).toHaveAttribute("data-snap-start", "");
    expect(screen.getByTestId("slide-1")).not.toHaveAttribute("data-snap-start");
    expect(screen.getByTestId("slide-2")).toHaveAttribute("data-snap-start", "");
    expect(screen.getByTestId("slide-3")).toHaveAttribute("data-snap-start", "");
    expect(screen.getByTestId("slide-4")).not.toHaveAttribute("data-snap-start");
  });
});
