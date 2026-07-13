import { createRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel } from "../index.ts";
import type { CarouselImperativeApi, CarouselOverscrollStatus } from "../index.ts";

function fireWheel(
  viewport: HTMLElement,
  init: { deltaX?: number; deltaY?: number },
) {
  const event = new WheelEvent("wheel", {
    deltaX: init.deltaX ?? 0,
    deltaY: init.deltaY ?? 0,
    cancelable: true,
    bubbles: true,
  });
  act(() => {
    viewport.dispatchEvent(event);
  });
}

describe("Carousel overscroll — keyboard", () => {
  it("should fire onOverscrollStatusChange with edge 'end' when ArrowRight is pressed on the last page", async () => {
    const onOverscrollStatusChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        defaultPage={2}
        onOverscrollStatusChange={onOverscrollStatusChange}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(onOverscrollStatusChange).toHaveBeenCalledWith({
      type: "overscroll",
      edge: "end",
      source: "keyboard",
      amount: 0,
      page: 2,
    } satisfies CarouselOverscrollStatus);
  });

  it("should fire onOverscrollStatusChange with edge 'start' when ArrowLeft is pressed on the first page", async () => {
    const onOverscrollStatusChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        onOverscrollStatusChange={onOverscrollStatusChange}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    await user.tab();
    await user.keyboard("{ArrowLeft}");

    expect(onOverscrollStatusChange).toHaveBeenCalledWith({
      type: "overscroll",
      edge: "start",
      source: "keyboard",
      amount: 0,
      page: 0,
    } satisfies CarouselOverscrollStatus);
  });

  it("should not fire onOverscrollStatusChange when the arrow key can still advance", async () => {
    const onOverscrollStatusChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        onOverscrollStatusChange={onOverscrollStatusChange}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(onOverscrollStatusChange).not.toHaveBeenCalled();
  });

  it("should not treat Home/End as overscroll even when already at that boundary", async () => {
    const onOverscrollStatusChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        onOverscrollStatusChange={onOverscrollStatusChange}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    await user.tab();
    await user.keyboard("{Home}");
    await user.keyboard("{End}");
    await user.keyboard("{End}");

    expect(onOverscrollStatusChange).not.toHaveBeenCalled();
  });
});

describe("Carousel overscroll — wheel", () => {
  it("should fire onOverscrollStatusChange with edge 'end' when wheeling forward on the last page", () => {
    const onOverscrollStatusChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        defaultPage={1}
        onOverscrollStatusChange={onOverscrollStatusChange}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    fireWheel(screen.getByTestId("viewport"), { deltaY: 30 });

    expect(onOverscrollStatusChange).toHaveBeenCalledWith({
      type: "overscroll",
      edge: "end",
      source: "wheel",
      amount: 0,
      page: 1,
    } satisfies CarouselOverscrollStatus);
  });

  it("should fire onOverscrollStatusChange with edge 'start' when wheeling backward on the first page", () => {
    const onOverscrollStatusChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        onOverscrollStatusChange={onOverscrollStatusChange}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    fireWheel(screen.getByTestId("viewport"), { deltaY: -30 });

    expect(onOverscrollStatusChange).toHaveBeenCalledWith({
      type: "overscroll",
      edge: "start",
      source: "wheel",
      amount: 0,
      page: 0,
    } satisfies CarouselOverscrollStatus);
  });

  it("should not fire onOverscrollStatusChange when wheeling within bounds", () => {
    const onOverscrollStatusChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        onOverscrollStatusChange={onOverscrollStatusChange}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    fireWheel(screen.getByTestId("viewport"), { deltaY: 30 });

    expect(onOverscrollStatusChange).not.toHaveBeenCalled();
  });
});

describe("Carousel overscroll — mouse drag", () => {
  it("should fire overscroll.start then overscroll while dragging past the start edge, and set data-overscroll", () => {
    const onOverscrollStatusChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        allowMouseDrag
        onOverscrollStatusChange={onOverscrollStatusChange}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "scrollLeft", { value: 0, writable: true });

    act(() => {
      fireEvent.pointerDown(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 200,
        clientY: 0,
      });
      // Positive delta drags toward the start edge — already page 0, so
      // this is an overscroll.
      fireEvent.pointerMove(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 210,
        clientY: 0,
      });
    });

    expect(onOverscrollStatusChange).toHaveBeenCalledWith({
      type: "overscroll.start",
      edge: "start",
      source: "drag",
      amount: 20,
      page: 0,
    } satisfies CarouselOverscrollStatus);
    expect(viewport).toHaveAttribute("data-overscroll", "start");

    act(() => {
      fireEvent.pointerMove(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 215,
        clientY: 0,
      });
    });

    expect(onOverscrollStatusChange).toHaveBeenLastCalledWith({
      type: "overscroll",
      edge: "start",
      source: "drag",
      amount: 30,
      page: 0,
    } satisfies CarouselOverscrollStatus);
  });

  it("should fire overscroll.end and clear data-overscroll on pointerup", () => {
    const onOverscrollStatusChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        allowMouseDrag
        onOverscrollStatusChange={onOverscrollStatusChange}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "scrollLeft", { value: 0, writable: true });

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
        clientX: 210,
        clientY: 0,
      });
      fireEvent.pointerUp(viewport, { pointerType: "mouse", pointerId: 1 });
    });

    expect(onOverscrollStatusChange).toHaveBeenLastCalledWith({
      type: "overscroll.end",
      edge: "start",
      source: "drag",
      amount: 0,
      page: 0,
    } satisfies CarouselOverscrollStatus);
    expect(viewport).not.toHaveAttribute("data-overscroll");
  });

  it("should fire overscroll.end mid-drag when the pointer reverses back within bounds without releasing", () => {
    const onOverscrollStatusChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        allowMouseDrag
        onOverscrollStatusChange={onOverscrollStatusChange}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "scrollLeft", { value: 0, writable: true });

    act(() => {
      fireEvent.pointerDown(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 200,
        clientY: 0,
      });
      // Overscroll toward start.
      fireEvent.pointerMove(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 210,
        clientY: 0,
      });
      // Reverse toward the end — back within bounds (page 0 can go next).
      fireEvent.pointerMove(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 195,
        clientY: 0,
      });
    });

    expect(onOverscrollStatusChange).toHaveBeenCalledWith({
      type: "overscroll.end",
      edge: "start",
      source: "drag",
      amount: 0,
      page: 0,
    } satisfies CarouselOverscrollStatus);
    expect(viewport).not.toHaveAttribute("data-overscroll");
  });

  it("should fire edge 'end' when dragging past the end edge on the last page", () => {
    const onOverscrollStatusChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        defaultPage={1}
        allowMouseDrag
        onOverscrollStatusChange={onOverscrollStatusChange}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "scrollLeft", { value: 0, writable: true });

    act(() => {
      fireEvent.pointerDown(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 200,
        clientY: 0,
      });
      // Negative delta drags toward the end edge — already on the last
      // page, so this is an overscroll.
      fireEvent.pointerMove(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 190,
        clientY: 0,
      });
    });

    expect(onOverscrollStatusChange).toHaveBeenCalledWith({
      type: "overscroll.start",
      edge: "end",
      source: "drag",
      amount: 20,
      page: 1,
    } satisfies CarouselOverscrollStatus);
    expect(viewport).toHaveAttribute("data-overscroll", "end");
  });

  it("should not fire onOverscrollStatusChange while dragging within bounds", () => {
    const onOverscrollStatusChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        defaultPage={1}
        allowMouseDrag
        onOverscrollStatusChange={onOverscrollStatusChange}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "scrollLeft", { value: 100, writable: true });

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

    expect(onOverscrollStatusChange).not.toHaveBeenCalled();
    expect(viewport).not.toHaveAttribute("data-overscroll");
  });

  it("should not fire overscroll.end on release when the drag never overscrolled", () => {
    const onOverscrollStatusChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        defaultPage={1}
        allowMouseDrag
        onOverscrollStatusChange={onOverscrollStatusChange}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "scrollLeft", { value: 100, writable: true });

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
    });

    expect(onOverscrollStatusChange).not.toHaveBeenCalled();
    expect(viewport).not.toHaveAttribute("data-overscroll");
  });
});

describe("Carousel imperative isOverscrolling", () => {
  it("should be false by default, true during a drag-overscroll, and false again after release", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(
      <Carousel.Root ref={ref} ariaLabel="Featured products" allowMouseDrag>
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "scrollLeft", { value: 0, writable: true });

    expect(ref.current!.isOverscrolling()).toBe(false);

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
        clientX: 210,
        clientY: 0,
      });
    });

    expect(ref.current!.isOverscrolling()).toBe(true);

    act(() => {
      fireEvent.pointerUp(viewport, { pointerType: "mouse", pointerId: 1 });
    });

    expect(ref.current!.isOverscrolling()).toBe(false);
  });

  it("should stay false for keyboard/wheel overscroll taps (not a sustained state)", async () => {
    const ref = createRef<CarouselImperativeApi>();
    const user = userEvent.setup();
    render(
      <Carousel.Root ref={ref} ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    await user.tab();
    await user.keyboard("{ArrowLeft}");

    expect(ref.current!.isOverscrolling()).toBe(false);
  });
});
