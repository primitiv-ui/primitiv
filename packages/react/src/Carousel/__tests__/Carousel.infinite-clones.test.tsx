import { render } from "@testing-library/react";

import { Carousel } from "../index.ts";

function renderCarousel(
  loop: boolean | "wrap" | "infinite" | undefined,
  count = 3,
) {
  return render(
    <Carousel.Root ariaLabel="Featured products" loop={loop}>
      <Carousel.Viewport>
        {Array.from({ length: count }).map((_, i) => (
          <Carousel.Slide key={i} data-testid={`slide-${i}`}>
            Slide {i}
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <Carousel.Indicators label="Choose slide" />
    </Carousel.Root>,
  );
}

describe("Carousel infinite — clone buffer", () => {
  it("should render no clones unless loop is infinite", () => {
    const { container } = renderCarousel("wrap");

    expect(container.querySelectorAll("[data-clone-of]")).toHaveLength(0);
  });

  it("should render no clones when the transition is not slide (e.g. fade)", () => {
    // fade stacks every slide in one grid cell with no scroll, so a clone
    // buffer is meaningless there — it would just duplicate stacked slides.
    const { container } = render(
      <Carousel.Root
        ariaLabel="Featured products"
        loop="infinite"
        transition="fade"
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0">Slide 0</Carousel.Slide>
          <Carousel.Slide data-testid="slide-1">Slide 1</Carousel.Slide>
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(container.querySelectorAll("[data-clone-of]")).toHaveLength(0);
  });

  it("should render a multi-period clone buffer on each side under loop=infinite", () => {
    const { container } = renderCarousel("infinite", 3);

    // BUFFER_PERIODS (2) complete copies of the real set leading and trailing =
    // 2 × BUFFER_PERIODS × count. The extra copies beyond one period give a hard
    // momentum fling more runway before it hits the physical scroll end.
    expect(container.querySelectorAll("[data-clone-of]")).toHaveLength(12);
  });

  it("should keep the real slide count, indices and total unaffected by the clones", () => {
    const { container } = renderCarousel("infinite", 3);

    // Real slides keep their contiguous 0..n-1 indices and a total of n,
    // never counting the clones. (The clones share the same test id, so
    // scope to the non-clone element.)
    [0, 1, 2].forEach((i) => {
      const real = container.querySelector(
        `[data-testid="slide-${i}"]:not([data-carousel-clone])`,
      );
      expect(real).toHaveAttribute("data-index", String(i));
      expect(real).toHaveAttribute("data-total", "3");
      expect(real).not.toHaveAttribute("data-clone-of");
    });
  });

  it("should render exactly one indicator per real slide, ignoring clones", () => {
    const { container } = renderCarousel("infinite", 3);

    // Auto Indicators render one dot per page (= per slide here); clones
    // must not inflate the count.
    expect(
      container.querySelectorAll("[data-carousel-indicator]"),
    ).toHaveLength(3);
  });

  it("should hide every clone from assistive tech and the tab order", () => {
    const { container } = renderCarousel("infinite", 3);

    const clones = container.querySelectorAll("[data-clone-of]");
    clones.forEach((clone) => {
      expect(clone).toHaveAttribute("aria-hidden", "true");
      expect(clone).toHaveAttribute("inert");
      expect(clone).toHaveAttribute("tabindex", "-1");
    });
  });

  it("should tag each clone with the real slide index it mirrors", () => {
    const { container } = renderCarousel("infinite", 3);

    const cloneIndices = Array.from(
      container.querySelectorAll("[data-clone-of]"),
      (el) => el.getAttribute("data-clone-of"),
    );
    // BUFFER_PERIODS (2) leading copies 0,1,2 then 2 trailing copies 0,1,2.
    expect(cloneIndices).toEqual([
      "0", "1", "2", "0", "1", "2", // leading (2 copies)
      "0", "1", "2", "0", "1", "2", // trailing (2 copies)
    ]);
  });

  it("should make a single-slide carousel's clones all snap points", () => {
    const { container } = renderCarousel("infinite", 3);

    // slidesPerPage 1 → every slide is a page leader, so every clone snaps.
    container.querySelectorAll("[data-clone-of]").forEach((clone) => {
      expect(clone).toHaveAttribute("data-snap-align", "center");
    });
  });

  it("should snap clones only on page-leading indices when slidesPerPage > 1", () => {
    const { container } = render(
      <Carousel.Root ariaLabel="Featured products" loop="infinite" slidesPerPage={2}>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0">Slide 0</Carousel.Slide>
          <Carousel.Slide data-testid="slide-1">Slide 1</Carousel.Slide>
          <Carousel.Slide data-testid="slide-2">Slide 2</Carousel.Slide>
          <Carousel.Slide data-testid="slide-3">Slide 3</Carousel.Slide>
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    // Pages [0,1] and [2,3] → snap-start indices 0 and 2. A clone snaps iff
    // its mirrored real slide leads a page.
    const snaps = (index: number) =>
      Array.from(container.querySelectorAll(`[data-clone-of="${index}"]`));
    snaps(0).forEach((c) => expect(c).toHaveAttribute("data-snap-align"));
    snaps(2).forEach((c) => expect(c).toHaveAttribute("data-snap-align"));
    snaps(1).forEach((c) => expect(c).not.toHaveAttribute("data-snap-align"));
    snaps(3).forEach((c) => expect(c).not.toHaveAttribute("data-snap-align"));
  });

  it("should not render clones when there are too few slides to loop", () => {
    const { container } = renderCarousel("infinite", 1);

    expect(container.querySelectorAll("[data-clone-of]")).toHaveLength(0);
  });

  it("should pass a non-element child through the clone buffer untouched", () => {
    // A stray text node among the slides must not crash cloneElement — it
    // passes through the buffer as-is while the real slides still clone.
    const { container } = render(
      <Carousel.Root ariaLabel="Featured products" loop="infinite">
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0">Slide 0</Carousel.Slide>
          <Carousel.Slide data-testid="slide-1">Slide 1</Carousel.Slide>
          {" "}
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    // Two real slide elements → BUFFER_PERIODS (2) element clones per side (the
    // text child is not an element, so it has no data-clone-of).
    expect(container.querySelectorAll("[data-clone-of]")).toHaveLength(8);
  });
});
