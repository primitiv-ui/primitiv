import { createRef } from "react";
import { act, render, screen } from "@testing-library/react";

import { Carousel } from "../index.ts";
import type { CarouselImperativeApi } from "../index.ts";

function fixture(apiRef: React.Ref<CarouselImperativeApi>, slides = 3) {
  return (
    <Carousel.Root ref={apiRef} ariaLabel="Featured products">
      <Carousel.Viewport>
        {Array.from({ length: slides }).map((_, i) => (
          <Carousel.Slide key={i} data-testid={`slide-${i}`} />
        ))}
      </Carousel.Viewport>
    </Carousel.Root>
  );
}

describe("Carousel imperative getProgress / refresh", () => {
  it("getProgress() should return the live page, totalPages, and a 0..1 value", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(fixture(ref, 4));

    expect(ref.current!.getProgress()).toEqual({
      page: 0,
      totalPages: 4,
      value: 0,
    });

    act(() => {
      ref.current!.goTo(2);
    });

    expect(ref.current!.getProgress()).toEqual({
      page: 2,
      totalPages: 4,
      value: 2 / 3,
    });
  });

  it("getProgress() should return value=0 when no slides are registered", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(
      <Carousel.Root ref={ref} ariaLabel="Featured products" />,
    );

    expect(ref.current!.getProgress()).toEqual({
      page: 0,
      totalPages: 0,
      value: 0,
    });
  });

  it("getProgress() should return value=0 with a single page", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(fixture(ref, 1));

    expect(ref.current!.getProgress()).toEqual({
      page: 0,
      totalPages: 1,
      value: 0,
    });
  });

  it("refresh() should re-issue the scroll for the current page", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(
      <Carousel.Root ref={ref} ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    const scrollIntoViewSpy = vi.spyOn(
      screen.getByTestId("slide-0"),
      "scrollIntoView",
    );

    act(() => {
      ref.current!.refresh();
    });

    expect(scrollIntoViewSpy).toHaveBeenCalled();
  });
});
