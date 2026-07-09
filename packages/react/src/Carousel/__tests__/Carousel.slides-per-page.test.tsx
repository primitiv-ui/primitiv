import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

describe("Carousel slidesPerPage", () => {
  it("should mark every slide on the active page as active when slidesPerPage > 1", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" slidesPerPage={2}>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
          <Carousel.Slide data-testid="slide-3" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "inactive",
    );
    expect(screen.getByTestId("slide-3")).toHaveAttribute(
      "data-state",
      "inactive",
    );
  });

  it("should render ceil(slides / slidesPerPage) indicators in Carousel.Indicators", () => {
    const { rerender } = render(
      <Carousel.Root ariaLabel="Featured products" slidesPerPage={2}>
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.Indicators label="Choose page" />
      </Carousel.Root>,
    );

    expect(
      screen.getAllByRole("button", { name: /^Slide \d+$/ }),
    ).toHaveLength(2);

    // Non-multiple total: ceil(5 / 2) === 3.
    rerender(
      <Carousel.Root ariaLabel="Featured products" slidesPerPage={2}>
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

    expect(
      screen.getAllByRole("button", { name: /^Slide \d+$/ }),
    ).toHaveLength(3);
  });

  it("should disable Carousel.NextTrigger at the last page (not the last slide)", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        slidesPerPage={2}
        defaultPage={1}
      >
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("should advance by one page when Carousel.NextTrigger is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products" slidesPerPage={2}>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
          <Carousel.Slide data-testid="slide-3" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-3")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should jump to the targeted page when an auto-rendered Indicator is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products" slidesPerPage={2}>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
          <Carousel.Slide data-testid="slide-3" />
        </Carousel.Viewport>
        <Carousel.Indicators label="Choose page" />
      </Carousel.Root>,
    );

    await user.click(screen.getByRole("button", { name: "Slide 2" }));

    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-3")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should end-align the last page so its window is full (not a partial page that can't start-snap)", () => {
    // perPage 2, 5 slides, last page. A naive offset of 2×2 = 4 leaves a
    // single-slide page [4] whose leading slide can't align to the viewport
    // start (there's nothing after it), so scroll-snap lands on slide 3 and the
    // active page desyncs. End-aligning the last page to offset 3 → window
    // [3,4], which snaps cleanly to the track end.
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        slidesPerPage={2}
        defaultPage={2}
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
          <Carousel.Slide data-testid="slide-3" />
          <Carousel.Slide data-testid="slide-4" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "inactive",
    );
    expect(screen.getByTestId("slide-3")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-4")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should reach the end-aligned last page in two clicks without desyncing (perPage 3, 7 slides)", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        slidesPerPage={3}
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
          <Carousel.Slide data-testid="slide-3" />
          <Carousel.Slide data-testid="slide-4" />
          <Carousel.Slide data-testid="slide-5" />
          <Carousel.Slide data-testid="slide-6" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    // 3 pages: [0,1,2] [3,4,5] [4,5,6] (last end-aligned). Two clicks reach it.
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByTestId("slide-4")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-6")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-3")).toHaveAttribute(
      "data-state",
      "inactive",
    );
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("should map a swipe onto the end-aligned last page to the last page (not the page a floor would give)", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" slidesPerPage={3}>
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
          <Carousel.Slide data-testid="slide-3" />
          <Carousel.Slide data-testid="slide-4" />
          <Carousel.Slide data-testid="slide-5" />
          <Carousel.Slide data-testid="slide-6" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    // The last page's leading slide is 4 (offset end-aligned to 7 − 3 = 4).
    // A floor(4 / 3) would map it to page 1; the nearest-offset inverse maps it
    // to the last page.
    fireScrollSnapChange(
      screen.getByTestId("viewport"),
      screen.getByTestId("slide-4"),
    );

    expect(screen.getByTestId("slide-4")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-6")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-3")).toHaveAttribute(
      "data-state",
      "inactive",
    );
  });
});
