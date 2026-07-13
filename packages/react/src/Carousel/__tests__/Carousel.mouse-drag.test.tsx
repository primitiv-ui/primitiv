import { act, fireEvent, render, screen } from "@testing-library/react";

import { Carousel } from "../index.ts";

// Click-and-drag scrolling: pointerdown + pointermove sets scrollLeft/
// scrollTop directly from the pointer delta, amplified by a sensitivity
// multiplier (no momentum — the multiplier only scales the tracked delta,
// there's still no motion after release), release lets the existing CSS
// scroll-snap-type settle to the nearest slide (no new code needed for that
// half — the scrollsnapchange sync already covers it). A small movement
// threshold distinguishes a drag from a click so a link/button inside a
// slide still works. Opt-in via `allowMouseDrag` (default `false`) — an
// unconditionally-on drag could conflict with a consumer's own
// drag-sensitive slide content.
describe("Carousel mouse-drag styling hook (data-mouse-drag)", () => {
  it("should not publish data-mouse-drag when allowMouseDrag is omitted (default false)", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(screen.getByTestId("viewport")).not.toHaveAttribute(
      "data-mouse-drag",
    );
  });

  it("should publish data-mouse-drag when allowMouseDrag is true, as a persistent hook distinct from the transient data-dragging", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" allowMouseDrag>
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(screen.getByTestId("viewport")).toHaveAttribute(
      "data-mouse-drag",
      "",
    );
  });
});

describe("Carousel mouse-drag scrolling (opt-in disabled)", () => {
  it("should not move scrollLeft or set the dragging hook when allowMouseDrag is omitted (default false)", () => {
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
    });

    expect(viewport.scrollLeft).toBe(100);
    expect(viewport).not.toHaveAttribute("data-dragging");
  });

  it("should not move scrollLeft or set the dragging hook when allowMouseDrag is explicitly false", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" allowMouseDrag={false}>
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
    });

    expect(viewport.scrollLeft).toBe(100);
    expect(viewport).not.toHaveAttribute("data-dragging");
  });
});

describe("Carousel mouse-drag scrolling (allowMouseDrag enabled)", () => {
  it("should not move scrollLeft for a pointer movement under the threshold", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" allowMouseDrag>
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

  it("should start tracking at a 3px movement (the lowered click-vs-drag threshold)", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" allowMouseDrag>
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
      // Exactly 3px — the threshold is now 3, so this crosses it (2px, in
      // the test above, still doesn't).
      fireEvent.pointerMove(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 203,
        clientY: 0,
      });
    });

    expect(viewport).toHaveAttribute("data-dragging", "");
  });

  it("should scroll faster than the raw pointer delta, amplified by the drag sensitivity multiplier", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" allowMouseDrag>
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
      // left — scrollLeft decreases by an amplified amount (2× the raw
      // 40px delta), not the raw delta itself, so a full-slide transition
      // doesn't require dragging the slide's full on-screen width.
      fireEvent.pointerMove(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 240,
        clientY: 0,
      });
    });

    expect(viewport.scrollLeft).toBe(20);
    expect(viewport).toHaveAttribute("data-dragging", "");
  });

  it("should set scrollTop instead of scrollLeft when the carousel is vertical, also amplified", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" orientation="vertical" allowMouseDrag>
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "scrollTop", {
      value: 100,
      writable: true,
    });

    act(() => {
      fireEvent.pointerDown(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 0,
        clientY: 100,
      });
      // 30px raw delta × 2 sensitivity = 60px of scroll.
      fireEvent.pointerMove(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 0,
        clientY: 130,
      });
    });

    expect(viewport.scrollTop).toBe(40);
  });

  it("should stop tracking and clear the dragging hook on pointerup", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" allowMouseDrag>
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

    expect(viewport.scrollLeft).toBe(20);
    expect(viewport).not.toHaveAttribute("data-dragging");
  });

  it("should stop tracking and clear the dragging hook on pointercancel", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" allowMouseDrag>
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
      <Carousel.Root ariaLabel="Featured products" allowMouseDrag>
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
      <Carousel.Root ariaLabel="Featured products" allowMouseDrag>
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
      <Carousel.Root ariaLabel="Featured products" allowMouseDrag>
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
      <Carousel.Root ariaLabel="Featured products" allowMouseDrag>
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

describe("Carousel native image-drag suppression (onDragStart)", () => {
  it("should prevent the browser's own image-drag ghost when allowMouseDrag is enabled", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" allowMouseDrag>
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide>
            <img src="photo.jpg" alt="Slide photo" />
          </Carousel.Slide>
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    // Real <img>/<a> elements are natively draggable, and a dragstart on one
    // bubbles up to the viewport, where our own handler lives — the browser's
    // HTML5 drag (the semi-transparent ghost that follows the cursor) must
    // never compete with the custom pointer-based drag-to-scroll. fireEvent
    // returns dispatchEvent's result: false once preventDefault is called.
    const dispatchResult = fireEvent.dragStart(
      screen.getByRole("img", { name: "Slide photo" }),
    );

    expect(dispatchResult).toBe(false);
  });

  it("should leave native image drag alone when allowMouseDrag is omitted (default false)", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide>
            <img src="photo.jpg" alt="Slide photo" />
          </Carousel.Slide>
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    const dispatchResult = fireEvent.dragStart(
      screen.getByRole("img", { name: "Slide photo" }),
    );

    expect(dispatchResult).toBe(true);
  });
});
