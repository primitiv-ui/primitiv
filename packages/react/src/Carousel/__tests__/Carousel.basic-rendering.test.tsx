import { render, screen } from "@testing-library/react";

import { Carousel } from "../index.ts";

describe("Carousel basic rendering tests", () => {
  describe("Carousel.Root", () => {
    it("should render the Carousel.Root component", () => {
      render(
        <Carousel.Root ariaLabel="Featured products" data-testid="carousel-root" />,
      );
      const carouselRoot = screen.getByTestId("carousel-root");

      expect(carouselRoot).toBeVisible();
    });

    it('should apply aria-roledescription="carousel" so assistive tech announces the widget as a carousel', () => {
      render(
        <Carousel.Root ariaLabel="Featured products" data-testid="carousel-root" />,
      );
      const carouselRoot = screen.getByTestId("carousel-root");

      expect(carouselRoot).toHaveAttribute("aria-roledescription", "carousel");
    });

    it("should expose the required ariaLabel prop as aria-label on the rendered element", () => {
      const label = "Featured products";
      render(<Carousel.Root ariaLabel={label} data-testid="carousel-root" />);
      const carouselRoot = screen.getByTestId("carousel-root");

      expect(carouselRoot).toHaveAttribute("aria-label", label);
    });

    it("should accept ariaLabelledBy as an alternative to ariaLabel", () => {
      const labelId = "carousel-heading";
      render(
        <>
          <h2 id={labelId}>Featured products</h2>
          <Carousel.Root ariaLabelledBy={labelId} data-testid="carousel-root" />
        </>,
      );
      const carouselRoot = screen.getByTestId("carousel-root");

      expect(carouselRoot).toHaveAttribute("aria-labelledby", labelId);
    });

    it("should render as a <section> element by default to match the WAI-ARIA carousel pattern", () => {
      render(
        <Carousel.Root ariaLabel="Featured products" data-testid="carousel-root" />,
      );
      const carouselRoot = screen.getByTestId("carousel-root");

      expect(carouselRoot.tagName).toBe("SECTION");
    });

    it("should accept a className prop", () => {
      const testClass = "custom-carousel-root";
      render(
        <Carousel.Root
          ariaLabel="Featured products"
          className={testClass}
          data-testid="carousel-root"
        />,
      );
      const carouselRoot = screen.getByTestId("carousel-root");

      expect(carouselRoot).toHaveAttribute("class", testClass);
    });

    it("should apply a className of empty string by default when not specified", () => {
      render(
        <Carousel.Root ariaLabel="Featured products" data-testid="carousel-root" />,
      );
      const carouselRoot = screen.getByTestId("carousel-root");

      expect(carouselRoot).toHaveAttribute("class", "");
    });

    it("should render children inside Carousel.Root", () => {
      render(
        <Carousel.Root ariaLabel="Featured products">
          <p>Carousel body</p>
        </Carousel.Root>,
      );

      expect(screen.getByText("Carousel body")).toBeVisible();
    });
  });

  describe("Carousel.Viewport", () => {
    it("should render the Carousel.Viewport component inside Carousel.Root", () => {
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.Viewport data-testid="carousel-viewport" />
        </Carousel.Root>,
      );
      const viewport = screen.getByTestId("carousel-viewport");

      expect(viewport).toBeVisible();
    });

    it("should render children inside the viewport", () => {
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.Viewport>
            <p>Slide body</p>
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      expect(screen.getByText("Slide body")).toBeVisible();
    });

    it("should set a data-carousel-viewport attribute as a CSS-targeting hook for the recommended scroll-snap rules", () => {
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.Viewport data-testid="carousel-viewport" />
        </Carousel.Root>,
      );
      const viewport = screen.getByTestId("carousel-viewport");

      expect(viewport).toHaveAttribute("data-carousel-viewport", "");
    });

    it("should accept a className prop", () => {
      const testClass = "custom-viewport";
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.Viewport
            className={testClass}
            data-testid="carousel-viewport"
          />
        </Carousel.Root>,
      );
      const viewport = screen.getByTestId("carousel-viewport");

      expect(viewport).toHaveAttribute("class", testClass);
    });

    it("should apply a className of empty string by default when not specified", () => {
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.Viewport data-testid="carousel-viewport" />
        </Carousel.Root>,
      );
      const viewport = screen.getByTestId("carousel-viewport");

      expect(viewport).toHaveAttribute("class", "");
    });

    it("should render slides in source order without injecting extra DOM nodes", () => {
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.Viewport data-testid="carousel-viewport">
            <Carousel.Slide data-testid="slide-0" />
            <Carousel.Slide data-testid="slide-1" />
            <Carousel.Slide data-testid="slide-2" />
          </Carousel.Viewport>
        </Carousel.Root>,
      );
      const viewport = screen.getByTestId("carousel-viewport");

      expect(viewport.querySelectorAll("[data-carousel-slide]")).toHaveLength(3);
      expect(
        viewport.querySelectorAll("[data-carousel-slide-clone]"),
      ).toHaveLength(0);
    });
  });

  describe("Carousel.Slide", () => {
    it("should render the Carousel.Slide component inside the viewport", () => {
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.Viewport>
            <Carousel.Slide data-testid="slide" />
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      expect(screen.getByTestId("slide")).toBeVisible();
    });

    it('should render with role="group" so assistive tech treats each slide as a discrete group', () => {
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.Viewport>
            <Carousel.Slide data-testid="slide" />
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      expect(screen.getByTestId("slide")).toHaveAttribute("role", "group");
    });

    it('should render with aria-roledescription="slide" per the WAI-ARIA Carousel pattern', () => {
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.Viewport>
            <Carousel.Slide data-testid="slide" />
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      expect(screen.getByTestId("slide")).toHaveAttribute(
        "aria-roledescription",
        "slide",
      );
    });

    it("should set a data-carousel-slide attribute as a CSS-targeting hook", () => {
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.Viewport>
            <Carousel.Slide data-testid="slide" />
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      expect(screen.getByTestId("slide")).toHaveAttribute(
        "data-carousel-slide",
        "",
      );
    });

    it("should render children inside the slide", () => {
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.Viewport>
            <Carousel.Slide>
              <p>Slide content</p>
            </Carousel.Slide>
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      expect(screen.getByText("Slide content")).toBeVisible();
    });

    it("should accept a className prop", () => {
      const testClass = "custom-slide";
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.Viewport>
            <Carousel.Slide className={testClass} data-testid="slide" />
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      expect(screen.getByTestId("slide")).toHaveAttribute("class", testClass);
    });

    it("should apply a className of empty string by default when not specified", () => {
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.Viewport>
            <Carousel.Slide data-testid="slide" />
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      expect(screen.getByTestId("slide")).toHaveAttribute("class", "");
    });

    it("should expose its zero-based registration position as data-index", () => {
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.Viewport>
            <Carousel.Slide data-testid="slide-0" />
            <Carousel.Slide data-testid="slide-1" />
            <Carousel.Slide data-testid="slide-2" />
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      expect(screen.getByTestId("slide-0")).toHaveAttribute("data-index", "0");
      expect(screen.getByTestId("slide-1")).toHaveAttribute("data-index", "1");
      expect(screen.getByTestId("slide-2")).toHaveAttribute("data-index", "2");
    });

    it("should expose the total registered slide count as data-total on every slide", () => {
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.Viewport>
            <Carousel.Slide data-testid="slide-0" />
            <Carousel.Slide data-testid="slide-1" />
            <Carousel.Slide data-testid="slide-2" />
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      ["slide-0", "slide-1", "slide-2"].forEach((id) => {
        expect(screen.getByTestId(id)).toHaveAttribute("data-total", "3");
      });
    });

    it("should update data-index and data-total when slides are unmounted", () => {
      const { rerender } = render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.Viewport>
            <Carousel.Slide data-testid="slide-0" />
            <Carousel.Slide data-testid="slide-1" />
            <Carousel.Slide data-testid="slide-2" />
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      rerender(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.Viewport>
            <Carousel.Slide data-testid="slide-0" />
            <Carousel.Slide data-testid="slide-2" />
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      expect(screen.getByTestId("slide-0")).toHaveAttribute("data-index", "0");
      expect(screen.getByTestId("slide-2")).toHaveAttribute("data-index", "1");
      expect(screen.getByTestId("slide-0")).toHaveAttribute("data-total", "2");
      expect(screen.getByTestId("slide-2")).toHaveAttribute("data-total", "2");
    });
  });

  describe("Carousel.Slide data-state", () => {
    it('should mark the slide at the active page with data-state="active" and the rest as "inactive"', () => {
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.Viewport>
            <Carousel.Slide data-testid="slide-0" />
            <Carousel.Slide data-testid="slide-1" />
            <Carousel.Slide data-testid="slide-2" />
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      expect(screen.getByTestId("slide-0")).toHaveAttribute(
        "data-state",
        "active",
      );
      expect(screen.getByTestId("slide-1")).toHaveAttribute(
        "data-state",
        "inactive",
      );
      expect(screen.getByTestId("slide-2")).toHaveAttribute(
        "data-state",
        "inactive",
      );
    });
  });

  describe("Carousel.NextTrigger", () => {
    it("should render the Carousel.NextTrigger component inside Carousel.Root", () => {
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.NextTrigger>Next</Carousel.NextTrigger>
        </Carousel.Root>,
      );

      expect(screen.getByRole("button", { name: "Next" })).toBeVisible();
    });

    it('should render with type="button"', () => {
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.NextTrigger>Next</Carousel.NextTrigger>
        </Carousel.Root>,
      );

      expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute(
        "type",
        "button",
      );
    });

    it("should accept a className prop", () => {
      const testClass = "custom-next";
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.NextTrigger className={testClass}>Next</Carousel.NextTrigger>
        </Carousel.Root>,
      );

      expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute(
        "class",
        testClass,
      );
    });

    it("should apply a className of empty string by default when not specified", () => {
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.NextTrigger>Next</Carousel.NextTrigger>
        </Carousel.Root>,
      );

      expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute(
        "class",
        "",
      );
    });
  });

  describe("Carousel.PreviousTrigger", () => {
    it("should render the Carousel.PreviousTrigger component inside Carousel.Root", () => {
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.PreviousTrigger>Previous</Carousel.PreviousTrigger>
        </Carousel.Root>,
      );

      expect(screen.getByRole("button", { name: "Previous" })).toBeVisible();
    });

    it('should render with type="button"', () => {
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.PreviousTrigger>Previous</Carousel.PreviousTrigger>
        </Carousel.Root>,
      );

      expect(screen.getByRole("button", { name: "Previous" })).toHaveAttribute(
        "type",
        "button",
      );
    });

    it("should accept a className prop", () => {
      const testClass = "custom-prev";
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.PreviousTrigger className={testClass}>
            Previous
          </Carousel.PreviousTrigger>
        </Carousel.Root>,
      );

      expect(screen.getByRole("button", { name: "Previous" })).toHaveAttribute(
        "class",
        testClass,
      );
    });

    it("should apply a className of empty string by default when not specified", () => {
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.PreviousTrigger>Previous</Carousel.PreviousTrigger>
        </Carousel.Root>,
      );

      expect(screen.getByRole("button", { name: "Previous" })).toHaveAttribute(
        "class",
        "",
      );
    });
  });

  describe("Carousel.Slide aria-label", () => {
    it('should auto-generate an aria-label of "N of M" using the slide\'s index and the live total', () => {
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.Viewport>
            <Carousel.Slide data-testid="slide-0" />
            <Carousel.Slide data-testid="slide-1" />
            <Carousel.Slide data-testid="slide-2" />
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      expect(screen.getByTestId("slide-0")).toHaveAttribute(
        "aria-label",
        "1 of 3",
      );
      expect(screen.getByTestId("slide-1")).toHaveAttribute(
        "aria-label",
        "2 of 3",
      );
      expect(screen.getByTestId("slide-2")).toHaveAttribute(
        "aria-label",
        "3 of 3",
      );
    });

    it("should update the auto-generated aria-label when slides are added or removed at runtime", () => {
      const { rerender } = render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.Viewport>
            <Carousel.Slide data-testid="slide-0" />
            <Carousel.Slide data-testid="slide-1" />
            <Carousel.Slide data-testid="slide-2" />
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      rerender(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.Viewport>
            <Carousel.Slide data-testid="slide-0" />
            <Carousel.Slide data-testid="slide-2" />
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      expect(screen.getByTestId("slide-0")).toHaveAttribute(
        "aria-label",
        "1 of 2",
      );
      expect(screen.getByTestId("slide-2")).toHaveAttribute(
        "aria-label",
        "2 of 2",
      );
    });

    it("should let the consumer override the auto-generated aria-label via the ariaLabel prop", () => {
      const customLabel = "Hand-picked for you";
      render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.Viewport>
            <Carousel.Slide ariaLabel={customLabel} data-testid="slide" />
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      expect(screen.getByTestId("slide")).toHaveAttribute(
        "aria-label",
        customLabel,
      );
    });

    it("should keep ariaLabel stable as siblings mount and unmount around it", () => {
      const customLabel = "Hand-picked for you";
      const { rerender } = render(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.Viewport>
            <Carousel.Slide data-testid="slide-0" />
            <Carousel.Slide ariaLabel={customLabel} data-testid="slide-1" />
            <Carousel.Slide data-testid="slide-2" />
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      rerender(
        <Carousel.Root ariaLabel="Featured products">
          <Carousel.Viewport>
            <Carousel.Slide ariaLabel={customLabel} data-testid="slide-1" />
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      expect(screen.getByTestId("slide-1")).toHaveAttribute(
        "aria-label",
        customLabel,
      );
    });
  });

  describe("context errors", () => {
    it.each([
      ["Carousel.Viewport", () => <Carousel.Viewport />],
      ["Carousel.Slide", () => <Carousel.Slide />],
      ["Carousel.NextTrigger", () => <Carousel.NextTrigger />],
      ["Carousel.PreviousTrigger", () => <Carousel.PreviousTrigger />],
    ] as const)(
      "should throw an error when %s is used outside Carousel.Root",
      (_, ComponentRenderer) => {
        expect(() => {
          render(ComponentRenderer());
        }).toThrow("Component must be rendered as a child of Carousel.Root");
      },
    );
  });
});
