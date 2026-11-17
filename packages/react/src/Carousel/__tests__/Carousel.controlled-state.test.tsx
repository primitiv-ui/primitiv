import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel } from "../index.ts";

describe("Carousel controlled page state", () => {
  it("should derive the active slide from the controlled page prop", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        page={1}
        onPageChange={() => {}}
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "inactive",
    );
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "inactive",
    );
  });

  it("should call onPageChange with page+1 when NextTrigger is clicked, without updating any internal state", async () => {
    const user = userEvent.setup();
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
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(1);
    // Parent has not re-rendered with a new page prop, so the active
    // slide must remain at the controlled value.
    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "inactive",
    );
  });

  it("should call onPageChange with page-1 when PreviousTrigger is clicked", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        page={2}
        onPageChange={onPageChange}
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
        <Carousel.PreviousTrigger>Previous</Carousel.PreviousTrigger>
      </Carousel.Root>,
    );

    await user.click(screen.getByRole("button", { name: "Previous" }));

    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("should reflect the parent's controlled page across both trigger clicks and external state changes", async () => {
    const user = userEvent.setup();
    function Parent() {
      const [page, setPage] = useState(0);
      return (
        <>
          <button type="button" onClick={() => setPage(0)}>
            Reset
          </button>
          <Carousel.Root
            ariaLabel="Featured products"
            page={page}
            onPageChange={setPage}
          >
            <Carousel.Viewport>
              <Carousel.Slide data-testid="slide-0" />
              <Carousel.Slide data-testid="slide-1" />
              <Carousel.Slide data-testid="slide-2" />
            </Carousel.Viewport>
            <Carousel.NextTrigger>Next</Carousel.NextTrigger>
          </Carousel.Root>
        </>
      );
    }

    render(<Parent />);

    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "active",
    );

    // External (non-trigger) state change must be reflected too — proves the
    // visual is driven by the controlled prop, not by an internal counter
    // that advances independently of the parent.
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );
  });
});
