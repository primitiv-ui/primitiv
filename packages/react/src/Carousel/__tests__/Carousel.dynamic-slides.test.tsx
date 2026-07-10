import { render } from "@testing-library/react";

import { Carousel } from "../index.ts";

describe("Carousel dynamic slide count", () => {
  it("should not crash the IntersectionObserver when the slide count shrinks in the same render that changes another viewport-effect dependency", () => {
    // Regression: the IO effect closes over `slideKeys` from its render but
    // reads the live `slidesRef`. When the slide count drops in the same commit
    // that another effect dependency changes (e.g. a Builder Reset flips
    // `transition` fade→slide and drops the count at once), the effect re-runs
    // with the pre-drop `slideKeys` while the removed slides have already left
    // `slidesRef` in the mutation phase — so `observer.observe` was handed
    // `undefined` for the orphaned keys.
    function Harness({
      count,
      transition,
    }: {
      count: number;
      transition: "slide" | "fade";
    }) {
      return (
        <Carousel.Root ariaLabel="Featured products" transition={transition}>
          <Carousel.Viewport>
            {Array.from({ length: count }, (_, index) => (
              <Carousel.Slide key={index} data-testid={`slide-${index}`} />
            ))}
          </Carousel.Viewport>
        </Carousel.Root>
      );
    }

    const { rerender } = render(<Harness count={8} transition="fade" />);

    expect(() =>
      rerender(<Harness count={4} transition="slide" />),
    ).not.toThrow();
  });
});
