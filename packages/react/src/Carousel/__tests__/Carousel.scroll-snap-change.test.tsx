import { act, render, screen } from "@testing-library/react";

import { Carousel } from "../index.ts";

function fireScrollSnapChange(viewport: HTMLElement, snapTarget: HTMLElement) {
  const event = new Event("scrollsnapchange", { bubbles: false });
  Object.defineProperty(event, "snapTargetInline", {
    value: snapTarget,
    writable: false,
  });
  act(() => {
    viewport.dispatchEvent(event);
  });
}

describe("Carousel scroll sync (user-driven via scrollsnapchange)", () => {
  it("should update the active page when the viewport reports a new snap target", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    fireScrollSnapChange(
      screen.getByTestId("viewport"),
      screen.getByTestId("slide-1"),
    );

    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should derive the page index from floor(slideIndex / slidesPerPage) when slidesPerPage > 1", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" slidesPerPage={2}>
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
          <Carousel.Slide data-testid="slide-3" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    // Snap target is slide 3 → page = floor(3/2) = 1.
    fireScrollSnapChange(
      screen.getByTestId("viewport"),
      screen.getByTestId("slide-3"),
    );

    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-3")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should call onPageChange in controlled mode when the user swipes", () => {
    const onPageChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        page={0}
        onPageChange={onPageChange}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    fireScrollSnapChange(
      screen.getByTestId("viewport"),
      screen.getByTestId("slide-1"),
    );

    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("should ignore scrollsnapchange events whose snap target is not a registered slide", () => {
    const onPageChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        page={0}
        onPageChange={onPageChange}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    const viewport = screen.getByTestId("viewport");
    // Snap target is the viewport itself (a stand-in for any non-slide
    // element a consumer might wrap inside). The handler must bail
    // without dispatching a page change.
    fireScrollSnapChange(viewport, viewport);

    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("should not invoke onPageChange when the snap target is on the already-active page, but should fire it when the page genuinely changes", () => {
    const onPageChange = vi.fn();
    function Parent() {
      // Stay on page 0 regardless of scroll events to keep the test
      // observable across both dispatch arms.
      return (
        <Carousel.Root
          ariaLabel="Featured products"
          page={0}
          onPageChange={onPageChange}
        >
          <Carousel.Viewport data-testid="viewport">
            <Carousel.Slide data-testid="slide-0" />
            <Carousel.Slide data-testid="slide-1" />
          </Carousel.Viewport>
        </Carousel.Root>
      );
    }

    render(<Parent />);

    // Snap to slide-0 on already-active page 0 → no callback.
    fireScrollSnapChange(
      screen.getByTestId("viewport"),
      screen.getByTestId("slide-0"),
    );
    expect(onPageChange).not.toHaveBeenCalled();

    // Snap to slide-1 → callback fires with the new page.
    fireScrollSnapChange(
      screen.getByTestId("viewport"),
      screen.getByTestId("slide-1"),
    );
    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("should not scroll the slide into view again after a user-driven scrollsnapchange", () => {
    // Regression: when the user swipes, the browser's CSS scroll-snap
    // already positions the viewport. The scrollsnapchange event updates
    // React state, which re-runs the scroll effect. If the effect calls
    // scrollIntoView here, two scroll animations fight and the result is
    // janky. The scroll effect must be a no-op for user-initiated page
    // changes.
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    const viewport = screen.getByTestId("viewport");
    const scrollIntoViewSpy = vi.spyOn(
      screen.getByTestId("slide-1"),
      "scrollIntoView",
    );

    fireScrollSnapChange(viewport, screen.getByTestId("slide-1"));

    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
  });
});
