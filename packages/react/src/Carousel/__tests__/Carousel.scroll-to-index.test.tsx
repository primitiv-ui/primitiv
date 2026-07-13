import { createRef, useRef } from "react";
import { act, render, screen } from "@testing-library/react";

import { Carousel } from "../index.ts";
import type { CarouselImperativeApi } from "../index.ts";

describe("Carousel imperative scrollToIndex", () => {
  it("should jump directly to the page containing the given slide index", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(
      <Carousel.Root ref={ref} ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    act(() => {
      ref.current!.scrollToIndex(2);
    });

    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should map a slide index to its containing multi-slide page, not just its own page", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(
      <Carousel.Root ref={ref} ariaLabel="Featured products" slidesPerPage={3}>
        <Carousel.Viewport>
          {Array.from({ length: 7 }, (_, index) => (
            <Carousel.Slide key={index} data-testid={`slide-${index}`} />
          ))}
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    // 7 slides / perPage 3 → pages [0,1,2] [3,4,5] [4,5,6] (the end-aligned
    // last page). Slide index 6 belongs to the last page, whose leading
    // slide is 4 — scrollToIndex(6) should land on that page, not treat 6
    // as its own page start.
    act(() => {
      ref.current!.scrollToIndex(6);
    });

    expect(screen.getByTestId("slide-4")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should scroll with behavior='instant' when scrollToIndex(index, true) is called", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(
      <Carousel.Root ref={ref} ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    const scrollToSpy = vi.spyOn(screen.getByTestId("viewport"), "scrollTo");

    act(() => {
      ref.current!.scrollToIndex(1, true);
    });

    expect(scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "instant" }),
    );
  });

  it("should route through onPageChange in controlled mode, like goTo", () => {
    const onPageChange = vi.fn();
    function Parent() {
      const ref = useRef<CarouselImperativeApi>(null);
      return (
        <>
          <button
            type="button"
            onClick={() => ref.current?.scrollToIndex(2)}
            data-testid="external-jump"
          >
            Jump
          </button>
          <Carousel.Root
            ref={ref}
            ariaLabel="Featured products"
            page={0}
            onPageChange={onPageChange}
          >
            <Carousel.Viewport>
              <Carousel.Slide data-testid="slide-0" />
              <Carousel.Slide data-testid="slide-1" />
              <Carousel.Slide data-testid="slide-2" />
            </Carousel.Viewport>
          </Carousel.Root>
        </>
      );
    }

    render(<Parent />);

    act(() => {
      screen.getByTestId("external-jump").click();
    });

    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
