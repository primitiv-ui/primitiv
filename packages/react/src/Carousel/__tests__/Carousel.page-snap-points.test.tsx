import { createRef } from "react";
import { render } from "@testing-library/react";

import { Carousel } from "../index.ts";
import type { CarouselImperativeApi } from "../index.ts";

describe("Carousel imperative getPageSnapPoints", () => {
  it("should return one offset per slide when there's no multi-slide paging", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(
      <Carousel.Root ref={ref} ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(ref.current!.getPageSnapPoints()).toEqual([0, 1, 2]);
  });

  it("should return the end-aligned offset for the last page when the total isn't a whole number of pages", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(
      <Carousel.Root ref={ref} ariaLabel="Featured products" slidesPerPage={3}>
        <Carousel.Viewport>
          {Array.from({ length: 7 }, (_, index) => (
            <Carousel.Slide key={index} />
          ))}
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    // 7 slides / perPage 3 → pages [0,1,2] [3,4,5] [4,5,6] (iteration 8's
    // end-align model): the last page's offset shifts back to 4, not 6.
    expect(ref.current!.getPageSnapPoints()).toEqual([0, 3, 4]);
  });

  it("should return an empty array when no slides are registered", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(
      <Carousel.Root ref={ref} ariaLabel="Featured products">
        <Carousel.Viewport />
      </Carousel.Root>,
    );

    expect(ref.current!.getPageSnapPoints()).toEqual([]);
  });
});
