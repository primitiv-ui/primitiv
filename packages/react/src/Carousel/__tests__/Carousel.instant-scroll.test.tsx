import { createRef } from "react";
import { act, render, screen } from "@testing-library/react";

import { Carousel } from "../index.ts";
import type { CarouselImperativeApi } from "../index.ts";

describe("Carousel imperative API — per-call instant scroll override", () => {
  it("should scroll with behavior='instant' when next(true) is called, even without prefers-reduced-motion", () => {
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
      ref.current!.next(true);
    });

    expect(scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "instant" }),
    );
  });

  it("should scroll with behavior='instant' when previous(true) is called", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(
      <Carousel.Root ref={ref} ariaLabel="Featured products" defaultPage={1}>
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    const scrollToSpy = vi.spyOn(screen.getByTestId("viewport"), "scrollTo");

    act(() => {
      ref.current!.previous(true);
    });

    expect(scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "instant" }),
    );
  });

  it("should scroll with behavior='instant' when goTo(page, true) is called", () => {
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
      ref.current!.goTo(1, true);
    });

    expect(scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "instant" }),
    );
  });

  it("should only skip the animation for that one call, reverting to smooth for the next navigation", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(
      <Carousel.Root ref={ref} ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    const scrollToSpy = vi.spyOn(screen.getByTestId("viewport"), "scrollTo");

    act(() => {
      ref.current!.next(true);
    });
    expect(scrollToSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ behavior: "instant" }),
    );

    act(() => {
      ref.current!.next();
    });
    expect(scrollToSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ behavior: "smooth" }),
    );
  });

  it("should default to the resolved smooth/reduced-motion behavior when no instant argument is passed", () => {
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
      ref.current!.next();
    });

    expect(scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "smooth" }),
    );
  });
});
