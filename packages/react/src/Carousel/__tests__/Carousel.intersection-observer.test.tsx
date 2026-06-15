import { RefObject, useRef } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel } from "../index.ts";
import type { CarouselImperativeApi } from "../index.ts";
import { MockIntersectionObserver } from "../../test/intersectionObserverPolyfill";

describe("Carousel IntersectionObserver fallback + isInView", () => {
  it("isInView(slideIndex) should reflect the observer's last reported intersection state", () => {
    const ref = {
      current: null,
    } as unknown as RefObject<CarouselImperativeApi>;

    render(
      <Carousel.Root ref={ref} ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(ref.current!.isInView(0)).toBe(false);
    expect(ref.current!.isInView(1)).toBe(false);

    const io = MockIntersectionObserver.latest!;
    act(() => {
      io.fire([
        {
          target: screen.getByTestId("slide-0"),
          isIntersecting: true,
          intersectionRatio: 1,
        },
        {
          target: screen.getByTestId("slide-1"),
          isIntersecting: false,
          intersectionRatio: 0,
        },
      ]);
    });

    expect(ref.current!.isInView(0)).toBe(true);
    expect(ref.current!.isInView(1)).toBe(false);
  });

  it("should drive currentPage from IO entries crossing the 0.6 threshold", () => {
    function Parent() {
      const ref = useRef<CarouselImperativeApi>(null);
      return (
        <Carousel.Root ref={ref} ariaLabel="Featured products">
          <Carousel.Viewport data-testid="viewport">
            <Carousel.Slide data-testid="slide-0" />
            <Carousel.Slide data-testid="slide-1" />
            <Carousel.Slide data-testid="slide-2" />
          </Carousel.Viewport>
        </Carousel.Root>
      );
    }

    render(<Parent />);

    // Settle the carousel's initial mount-time scroll so the IO callback
    // is not gated by the in-flight programmatic scroll guard.
    act(() => {
      screen.getByTestId("viewport").dispatchEvent(new Event("scrollend"));
    });

    const io = MockIntersectionObserver.latest!;
    act(() => {
      io.fire([
        {
          target: screen.getByTestId("slide-0"),
          isIntersecting: false,
          intersectionRatio: 0.1,
        },
        {
          target: screen.getByTestId("slide-2"),
          isIntersecting: true,
          intersectionRatio: 0.9,
        },
      ]);
    });

    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should not change the page when no observed slides cross the visibility threshold", () => {
    const onPageChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        page={0}
        onPageChange={onPageChange}
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    const io = MockIntersectionObserver.latest!;
    act(() => {
      io.fire([
        {
          target: screen.getByTestId("slide-0"),
          isIntersecting: false,
          intersectionRatio: 0.2,
        },
        {
          target: screen.getByTestId("slide-1"),
          isIntersecting: false,
          intersectionRatio: 0.1,
        },
      ]);
    });

    expect(onPageChange).not.toHaveBeenCalled();
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

    // Settle the carousel's initial mount-time scroll so the IO callback
    // is not gated by the in-flight programmatic scroll guard.
    act(() => {
      screen.getByTestId("viewport").dispatchEvent(new Event("scrollend"));
    });

    const io = MockIntersectionObserver.latest!;
    act(() => {
      io.fire([
        {
          target: screen.getByTestId("slide-3"),
          isIntersecting: true,
          intersectionRatio: 0.8,
        },
      ]);
    });

    // floor(3 / 2) = page 1; slides 2 and 3 active.
    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-3")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should not drive the page from the IntersectionObserver when the browser supports scrollsnapchange", () => {
    // scrollsnapchange reports the precise centred snap target, so it owns
    // the active page. The IO's lowest-index-visible heuristic is only a
    // fallback for browsers without the event — and for a centre-aligned
    // carousel that shows several slides at once it would override the
    // correct page with the *leftmost* visible slide. When the event is
    // available the observer must feed isInView only, not the page.
    const ref = {
      current: null,
    } as unknown as RefObject<CarouselImperativeApi>;
    // The presence of the on* handler property is the feature-detection
    // signal; assigning it (even null) makes `"onscrollsnapchange" in window`
    // true the way a supporting browser does.
    (
      window as unknown as { onscrollsnapchange: unknown }
    ).onscrollsnapchange = null;
    try {
      render(
        <Carousel.Root
          ref={ref}
          ariaLabel="Featured products"
          snapAlign="center"
        >
          <Carousel.Viewport data-testid="viewport">
            <Carousel.Slide data-testid="slide-0" />
            <Carousel.Slide data-testid="slide-1" />
            <Carousel.Slide data-testid="slide-2" />
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      act(() => {
        screen.getByTestId("viewport").dispatchEvent(new Event("scrollend"));
      });

      const io = MockIntersectionObserver.latest!;
      act(() => {
        io.fire([
          {
            target: screen.getByTestId("slide-2"),
            isIntersecting: true,
            intersectionRatio: 0.9,
          },
        ]);
      });

      // The page stays put — scrollsnapchange owns it…
      expect(screen.getByTestId("slide-0")).toHaveAttribute(
        "data-state",
        "active",
      );
      expect(screen.getByTestId("slide-2")).toHaveAttribute(
        "data-state",
        "inactive",
      );
      // …but isInView still reflects what the observer reported.
      expect(ref.current!.isInView(2)).toBe(true);
    } finally {
      delete (window as unknown as { onscrollsnapchange?: unknown })
        .onscrollsnapchange;
    }
  });

  it("should not let an IO callback reset the page while a programmatic scroll is in flight", async () => {
    // Regression test: clicking NextTrigger calls next() which sets
    // internalPage to 1 and triggers a scrollIntoView. If the IO callback
    // fires before the scroll settles (slide-0 still ≥0.6 visible), the
    // callback must not call goTo(0) and undo the navigation.
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    // Simulate the IO callback firing mid-scroll: slide-0 still highly
    // visible because the smooth-scroll animation hasn't finished yet.
    const io = MockIntersectionObserver.latest!;
    act(() => {
      io.fire([
        {
          target: screen.getByTestId("slide-0"),
          isIntersecting: true,
          intersectionRatio: 0.9,
        },
        {
          target: screen.getByTestId("slide-1"),
          isIntersecting: false,
          intersectionRatio: 0.1,
        },
      ]);
    });

    // The page must remain at 1, not be reset to 0.
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "inactive",
    );
  });
});
