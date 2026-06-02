import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel } from "..";

describe("Carousel numeric slidesPerMove", () => {
  it("should render `floor((total - slidesPerPage) / slidesPerMove) + 1` indicators", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        slidesPerPage={3}
        slidesPerMove={1}
      >
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.Indicators label="Choose page" />
      </Carousel.Root>,
    );

    // 5 slides, slidesPerPage=3, slidesPerMove=1 → 3 windowed pages
    // (showing [0,1,2], [1,2,3], [2,3,4]).
    expect(
      screen.getAllByRole("button", { name: /^Slide \d+$/ }),
    ).toHaveLength(3);
  });

  it("should slide the active window by slidesPerMove slides per NextTrigger click", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        slidesPerPage={3}
        slidesPerMove={1}
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
          <Carousel.Slide data-testid="slide-3" />
          <Carousel.Slide data-testid="slide-4" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    // Page 0: [0,1,2]
    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-3")).toHaveAttribute(
      "data-state",
      "inactive",
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    // Page 1 with slidesPerMove=1 → window [1,2,3]
    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "inactive",
    );
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-3")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-4")).toHaveAttribute(
      "data-state",
      "inactive",
    );
  });

  it("should disable NextTrigger at the last windowed page", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        slidesPerPage={3}
        slidesPerMove={1}
        defaultPage={2}
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
          <Carousel.Slide data-testid="slide-3" />
          <Carousel.Slide data-testid="slide-4" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    // defaultPage=2 is the last (window [2,3,4]); Next is disabled.
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByTestId("slide-4")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should treat slidesPerMove=2 with slidesPerPage=3 as advancing two slides per click", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        slidesPerPage={3}
        slidesPerMove={2}
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
          <Carousel.Slide data-testid="slide-3" />
          <Carousel.Slide data-testid="slide-4" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    // Page 1, pageOffset = 1 * 2 = 2 → window [2,3,4]
    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-4")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "inactive",
    );
  });

});
