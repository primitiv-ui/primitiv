import { render, screen } from "@testing-library/react";

import { Carousel } from "..";

describe("Carousel error handling", () => {
  it("should throw when Carousel.PlayPauseTrigger is rendered without autoplay enabled on Carousel.Root", () => {
    expect(() => {
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.PlayPauseTrigger />
        </Carousel.Root>,
      );
    }).toThrow(
      "Carousel.PlayPauseTrigger requires autoplay to be enabled on Carousel.Root",
    );
  });

  it("should throw when Carousel.PlayPauseTrigger is rendered with autoplay={false}", () => {
    expect(() => {
      render(
        <Carousel.Root ariaLabel="Featured products" autoplay={false}>
          <Carousel.PlayPauseTrigger />
        </Carousel.Root>,
      );
    }).toThrow(
      "Carousel.PlayPauseTrigger requires autoplay to be enabled on Carousel.Root",
    );
  });

  it("should throw when controlled page is greater than or equal to totalPages", () => {
    expect(() => {
      render(
        <Carousel.Root
          ariaLabel="Featured products"
          page={5}
          onPageChange={() => {}}
        >
          <Carousel.Viewport>
            <Carousel.Slide />
            <Carousel.Slide />
            <Carousel.Slide />
          </Carousel.Viewport>
        </Carousel.Root>,
      );
    }).toThrow(/page index 5 is out of range/);
  });

  it("should throw when controlled page is negative", () => {
    expect(() => {
      render(
        <Carousel.Root
          ariaLabel="Featured products"
          page={-1}
          onPageChange={() => {}}
        >
          <Carousel.Viewport>
            <Carousel.Slide />
            <Carousel.Slide />
          </Carousel.Viewport>
        </Carousel.Root>,
      );
    }).toThrow(/page index -1 is out of range/);
  });

  it("should clamp an out-of-range defaultPage to the last valid page without throwing", () => {
    // Uncontrolled carousels silently clamp rather than throw so that
    // an out-of-range defaultPage (or a stale internalPage after slide
    // re-registration during HMR / tab switch) doesn't crash the tree.
    render(
      <Carousel.Root ariaLabel="Featured products" defaultPage={5}>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(screen.getByTestId("slide-2")).toHaveAttribute("data-state", "active");
  });
});
