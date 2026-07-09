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

  it("should end-align the last window so an inexact move leaves no slide unreachable", () => {
    // 6 slides, perPage=3, move=2. A naive floor((6-3)/2)+1 = 2 pages
    // ([0,1,2] [2,3,4]) orphans slide 5. End-aligning the last window
    // adds a third page ([3,4,5]) so every slide is reachable.
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        slidesPerPage={3}
        slidesPerMove={2}
      >
        <Carousel.Viewport>
          <Carousel.Slide />
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

  it("should snap the end-aligned last window to the track end", async () => {
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
          <Carousel.Slide data-testid="slide-5" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    // page 0 [0,1,2] → page 1 [2,3,4] → page 2 end-aligned to [3,4,5].
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByTestId("slide-3")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-5")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "inactive",
    );
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("should clamp slidesPerMove to slidesPerPage so a move can't skip past a page", () => {
    // move=3 > perPage=2 would leave a gap (window [0,1] then [3,4],
    // skipping slide 2). Clamp move to perPage so windows stay contiguous:
    // 6 slides → [0,1] [2,3] [4,5] → 3 pages.
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        slidesPerPage={2}
        slidesPerMove={3}
      >
        <Carousel.Viewport>
          <Carousel.Slide />
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

  it("should advance by at most slidesPerPage when slidesPerMove exceeds it", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        slidesPerPage={2}
        slidesPerMove={3}
      >
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

    // Clamped move=2 → window [2,3], not the [3,…] a move of 3 would give.
    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-3")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "inactive",
    );
  });

  it("should map a user swipe to the nearest window in numeric slidesPerMove mode", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        slidesPerPage={3}
        slidesPerMove={2}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
          <Carousel.Slide data-testid="slide-3" />
          <Carousel.Slide data-testid="slide-4" />
          <Carousel.Slide data-testid="slide-5" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    // The user swipes so slide 3 leads the viewport. With move=2 the nearest
    // window start is the end-aligned last page [3,4,5], not floor(3/2)=1's
    // [2,3,4].
    fireScrollSnapChange(
      screen.getByTestId("viewport"),
      screen.getByTestId("slide-3"),
    );

    expect(screen.getByTestId("slide-3")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-5")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "inactive",
    );
  });
});
