import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel } from "../index.ts";

function fireVerticalSnapChange(viewport: HTMLElement, snapTarget: HTMLElement) {
  const event = new Event("scrollsnapchange", { bubbles: false });
  // Vertical carousels snap on the block axis, so the browser reports the
  // new target via snapTargetBlock rather than snapTargetInline.
  Object.defineProperty(event, "snapTargetBlock", {
    value: snapTarget,
    writable: false,
  });
  act(() => {
    viewport.dispatchEvent(event);
  });
}

describe("Carousel orientation", () => {
  describe("data-orientation", () => {
    it("should default to a horizontal orientation on the root", () => {
      render(
        <Carousel.Root ariaLabel="Featured products" data-testid="root" />,
      );

      expect(screen.getByTestId("root")).toHaveAttribute(
        "data-orientation",
        "horizontal",
      );
    });

    it('should reflect orientation="vertical" as data-orientation on the root', () => {
      render(
        <Carousel.Root
          ariaLabel="Featured products"
          orientation="vertical"
          data-testid="root"
        />,
      );

      expect(screen.getByTestId("root")).toHaveAttribute(
        "data-orientation",
        "vertical",
      );
    });
  });

  describe("vertical scroll axis", () => {
    it("should scroll the viewport on the block axis (top) when vertical", async () => {
      const user = userEvent.setup();
      render(
        // snapAlign="start" isolates this test's concern (block-axis vs.
        // inline-axis scrolling) from the root's default alignment, which
        // centre-aligns and would otherwise shift the expected scroll
        // position for a reason unrelated to what this test is checking.
        <Carousel.Root
          ariaLabel="Featured products"
          orientation="vertical"
          snapAlign="start"
        >
          <Carousel.Viewport data-testid="viewport">
            <Carousel.Slide data-testid="slide-0" />
            <Carousel.Slide data-testid="slide-1" />
          </Carousel.Viewport>
          <Carousel.NextTrigger>Next</Carousel.NextTrigger>
        </Carousel.Root>,
      );

      // Vertical carousels scroll the viewport on the block axis: the target
      // slide 360px below the viewport top drives a top-axis scrollTo.
      const scrollToSpy = vi.spyOn(screen.getByTestId("viewport"), "scrollTo");
      vi.spyOn(
        screen.getByTestId("slide-1"),
        "getBoundingClientRect",
      ).mockReturnValue({ left: 0, top: 360, width: 320, height: 180 } as DOMRect);

      await user.click(screen.getByRole("button", { name: "Next" }));

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 360, behavior: "smooth" });
    });

    it("should centre the target slide on the block axis when vertical and snapAlign is 'center'", async () => {
      const user = userEvent.setup();
      render(
        <Carousel.Root
          ariaLabel="Featured products"
          orientation="vertical"
          snapAlign="center"
        >
          <Carousel.Viewport data-testid="viewport">
            <Carousel.Slide data-testid="slide-0" />
            <Carousel.Slide data-testid="slide-1" />
          </Carousel.Viewport>
          <Carousel.NextTrigger>Next</Carousel.NextTrigger>
        </Carousel.Root>,
      );

      // A 400-tall slide at block 400 in a 1000-tall viewport centres at
      // 400 - (1000 - 400) / 2 = 100.
      const viewport = screen.getByTestId("viewport");
      Object.defineProperty(viewport, "clientHeight", { value: 1000, configurable: true });
      const scrollToSpy = vi.spyOn(viewport, "scrollTo");
      vi.spyOn(
        screen.getByTestId("slide-1"),
        "getBoundingClientRect",
      ).mockReturnValue({ left: 0, top: 400, width: 320, height: 400 } as DOMRect);

      await user.click(screen.getByRole("button", { name: "Next" }));

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 100, behavior: "smooth" });
    });
  });

  describe("vertical scroll sync", () => {
    it("should update the active page from snapTargetBlock when vertical", () => {
      render(
        <Carousel.Root ariaLabel="Featured products" orientation="vertical">
          <Carousel.Viewport data-testid="viewport">
            <Carousel.Slide data-testid="slide-0" />
            <Carousel.Slide data-testid="slide-1" />
            <Carousel.Slide data-testid="slide-2" />
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      fireVerticalSnapChange(
        screen.getByTestId("viewport"),
        screen.getByTestId("slide-1"),
      );

      expect(screen.getByTestId("slide-1")).toHaveAttribute(
        "data-state",
        "active",
      );
    });
  });

  describe("vertical keyboard navigation", () => {
    it("should advance the active page when ArrowDown is pressed with the viewport focused", async () => {
      const user = userEvent.setup();
      render(
        <Carousel.Root ariaLabel="Featured products" orientation="vertical">
          <Carousel.Viewport data-testid="viewport">
            <Carousel.Slide data-testid="slide-0" />
            <Carousel.Slide data-testid="slide-1" />
            <Carousel.Slide data-testid="slide-2" />
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      await user.tab();
      expect(screen.getByTestId("viewport")).toHaveFocus();

      await user.keyboard("{ArrowDown}");

      expect(screen.getByTestId("slide-1")).toHaveAttribute(
        "data-state",
        "active",
      );
    });

    it("should retreat the active page when ArrowUp is pressed with the viewport focused", async () => {
      const user = userEvent.setup();
      render(
        <Carousel.Root
          ariaLabel="Featured products"
          orientation="vertical"
          defaultPage={2}
        >
          <Carousel.Viewport data-testid="viewport">
            <Carousel.Slide data-testid="slide-0" />
            <Carousel.Slide data-testid="slide-1" />
            <Carousel.Slide data-testid="slide-2" />
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      await user.tab();
      await user.keyboard("{ArrowUp}");

      expect(screen.getByTestId("slide-1")).toHaveAttribute(
        "data-state",
        "active",
      );
    });

    it("should ignore the horizontal arrow keys when vertical", async () => {
      const user = userEvent.setup();
      render(
        <Carousel.Root ariaLabel="Featured products" orientation="vertical">
          <Carousel.Viewport data-testid="viewport">
            <Carousel.Slide data-testid="slide-0" />
            <Carousel.Slide data-testid="slide-1" />
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      await user.tab();
      await user.keyboard("{ArrowRight}");

      expect(screen.getByTestId("slide-0")).toHaveAttribute(
        "data-state",
        "active",
      );
    });
  });
});
