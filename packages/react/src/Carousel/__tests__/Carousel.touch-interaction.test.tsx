import { act, fireEvent, render, screen } from "@testing-library/react";

import { Carousel } from "../index.ts";

describe("Carousel autoplay touch-pause (WCAG 2.2.2)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should pause the timer while a touch is active on the Root, then resume on pointerup", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay
        defaultPlaying
        data-testid="carousel-root"
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    const root = screen.getByTestId("carousel-root");

    act(() => {
      fireEvent.pointerDown(root, { pointerType: "touch" });
    });

    // Touch active: timer paused, no advance.
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );

    act(() => {
      fireEvent.pointerUp(root, { pointerType: "touch" });
    });
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should pause during a touch and resume on pointercancel", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay
        defaultPlaying
        data-testid="carousel-root"
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    const root = screen.getByTestId("carousel-root");

    act(() => {
      fireEvent.pointerDown(root, { pointerType: "touch" });
    });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );

    act(() => {
      fireEvent.pointerCancel(root, { pointerType: "touch" });
    });
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
  });
});
