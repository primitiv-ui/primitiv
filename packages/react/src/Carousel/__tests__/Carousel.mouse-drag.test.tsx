import { act, fireEvent, render, screen } from "@testing-library/react";

import { Carousel } from "../index.ts";

// Click-and-drag scrolling: pointerdown + pointermove sets scrollLeft/
// scrollTop directly (1:1 with the pointer, no momentum), release lets the
// existing CSS scroll-snap-type settle to the nearest slide (no new code
// needed for that half — the scrollsnapchange sync already covers it). A
// small movement threshold distinguishes a drag from a click so a link/
// button inside a slide still works.
describe("Carousel mouse-drag scrolling", () => {
  it("should not move scrollLeft for a pointer movement under the threshold", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "scrollLeft", {
      value: 100,
      writable: true,
    });

    act(() => {
      fireEvent.pointerDown(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 200,
        clientY: 0,
      });
      fireEvent.pointerMove(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 202,
        clientY: 0,
      });
    });

    expect(viewport.scrollLeft).toBe(100);
    expect(viewport).not.toHaveAttribute("data-dragging");
  });

  it("should set scrollLeft to track the pointer 1:1 once past the movement threshold", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "scrollLeft", {
      value: 100,
      writable: true,
    });

    act(() => {
      fireEvent.pointerDown(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 200,
        clientY: 0,
      });
      // Dragging the pointer 40px to the right reveals content to the
      // left — scrollLeft decreases by the same amount.
      fireEvent.pointerMove(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 240,
        clientY: 0,
      });
    });

    expect(viewport.scrollLeft).toBe(60);
    expect(viewport).toHaveAttribute("data-dragging", "");
  });

  it("should set scrollTop instead of scrollLeft when the carousel is vertical", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" orientation="vertical">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "scrollTop", {
      value: 50,
      writable: true,
    });

    act(() => {
      fireEvent.pointerDown(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 0,
        clientY: 100,
      });
      fireEvent.pointerMove(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 0,
        clientY: 130,
      });
    });

    expect(viewport.scrollTop).toBe(20);
  });

  it("should stop tracking and clear the dragging hook on pointerup", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "scrollLeft", {
      value: 100,
      writable: true,
    });

    act(() => {
      fireEvent.pointerDown(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 200,
        clientY: 0,
      });
      fireEvent.pointerMove(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 240,
        clientY: 0,
      });
      fireEvent.pointerUp(viewport, { pointerType: "mouse", pointerId: 1 });
      // A move after release must not keep tracking.
      fireEvent.pointerMove(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 300,
        clientY: 0,
      });
    });

    expect(viewport.scrollLeft).toBe(60);
    expect(viewport).not.toHaveAttribute("data-dragging");
  });

  it("should stop tracking and clear the dragging hook on pointercancel", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "scrollLeft", {
      value: 100,
      writable: true,
    });

    act(() => {
      fireEvent.pointerDown(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 200,
        clientY: 0,
      });
      fireEvent.pointerMove(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 240,
        clientY: 0,
      });
      fireEvent.pointerCancel(viewport, {
        pointerType: "mouse",
        pointerId: 1,
      });
    });

    expect(viewport).not.toHaveAttribute("data-dragging");
  });

  it("should no-op a pointerup with no preceding pointerdown-tracked drag", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");

    expect(() => {
      act(() => {
        fireEvent.pointerUp(viewport, { pointerType: "mouse", pointerId: 1 });
      });
    }).not.toThrow();
    expect(viewport).not.toHaveAttribute("data-dragging");
  });

  it("should ignore non-mouse pointer types (native touch scroll already handles them)", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "scrollLeft", {
      value: 100,
      writable: true,
    });

    act(() => {
      fireEvent.pointerDown(viewport, {
        pointerType: "touch",
        pointerId: 1,
        clientX: 200,
        clientY: 0,
      });
      fireEvent.pointerMove(viewport, {
        pointerType: "touch",
        pointerId: 1,
        clientX: 240,
        clientY: 0,
      });
    });

    expect(viewport.scrollLeft).toBe(100);
    expect(viewport).not.toHaveAttribute("data-dragging");
  });

  it("should suppress the click that follows a real drag, so a link under the pointer doesn't fire", () => {
    const onClick = vi.fn();
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide>
            <button type="button" onClick={onClick}>
              Inner
            </button>
          </Carousel.Slide>
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "scrollLeft", {
      value: 100,
      writable: true,
    });
    const button = screen.getByRole("button", { name: "Inner" });

    act(() => {
      fireEvent.pointerDown(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 200,
        clientY: 0,
      });
      fireEvent.pointerMove(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 240,
        clientY: 0,
      });
      fireEvent.pointerUp(viewport, { pointerType: "mouse", pointerId: 1 });
      // Browsers still synthesize a click at the release point after a
      // drag unless it's suppressed.
      fireEvent.click(button);
    });

    expect(onClick).not.toHaveBeenCalled();
  });

  it("should not suppress a plain click that never crossed the drag threshold", async () => {
    const onClick = vi.fn();
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide>
            <button type="button" onClick={onClick}>
              Inner
            </button>
          </Carousel.Slide>
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");
    const button = screen.getByRole("button", { name: "Inner" });

    act(() => {
      fireEvent.pointerDown(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 200,
        clientY: 0,
      });
      fireEvent.pointerUp(viewport, { pointerType: "mouse", pointerId: 1 });
      fireEvent.click(button);
    });

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
