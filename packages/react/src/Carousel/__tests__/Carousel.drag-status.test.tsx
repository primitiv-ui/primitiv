import { createRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { Carousel } from "../index.ts";
import type { CarouselImperativeApi } from "../index.ts";

// Drag status: imperative isDragging() + an onDragStatusChange callback,
// mirroring Ark UI's api.isDragging / onDragStatusChange shape. The
// existing data-dragging DOM hook already tracks this for CSS, but a
// consumer couldn't react to drag start/end in JS (e.g. to pause a video
// in the active slide while dragging) until now.
describe("Carousel drag status", () => {
  function drag(viewport: HTMLElement) {
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
  }

  it("should report isDragging() as false before any drag", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(
      <Carousel.Root ref={ref} ariaLabel="Featured products" allowMouseDrag>
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(ref.current!.isDragging()).toBe(false);
  });

  it("should report isDragging() as true once a drag crosses the threshold", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(
      <Carousel.Root ref={ref} ariaLabel="Featured products" allowMouseDrag>
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    act(() => {
      drag(screen.getByTestId("viewport"));
    });

    expect(ref.current!.isDragging()).toBe(true);
  });

  it("should report isDragging() as false again after pointerup", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(
      <Carousel.Root ref={ref} ariaLabel="Featured products" allowMouseDrag>
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");

    act(() => {
      drag(viewport);
      fireEvent.pointerUp(viewport, { pointerType: "mouse", pointerId: 1 });
    });

    expect(ref.current!.isDragging()).toBe(false);
  });

  it("should not flip isDragging() for a movement under the click-vs-drag threshold", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(
      <Carousel.Root ref={ref} ariaLabel="Featured products" allowMouseDrag>
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");

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
        clientX: 201,
        clientY: 0,
      });
    });

    expect(ref.current!.isDragging()).toBe(false);
  });

  it("should call onDragStatusChange with type 'dragging.start' when a drag crosses the threshold", () => {
    const onDragStatusChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        allowMouseDrag
        onDragStatusChange={onDragStatusChange}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    act(() => {
      drag(screen.getByTestId("viewport"));
    });

    expect(onDragStatusChange).toHaveBeenCalledWith({
      type: "dragging.start",
      page: 0,
      isDragging: true,
    });
  });

  it("should call onDragStatusChange with type 'dragging' on subsequent moves while already dragging", () => {
    const onDragStatusChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        allowMouseDrag
        onDragStatusChange={onDragStatusChange}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");

    act(() => {
      drag(viewport);
      onDragStatusChange.mockClear();
      fireEvent.pointerMove(viewport, {
        pointerType: "mouse",
        pointerId: 1,
        clientX: 260,
        clientY: 0,
      });
    });

    expect(onDragStatusChange).toHaveBeenCalledWith({
      type: "dragging",
      page: 0,
      isDragging: true,
    });
  });

  it("should call onDragStatusChange with type 'dragging.end' on pointerup after a real drag", () => {
    const onDragStatusChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        allowMouseDrag
        onDragStatusChange={onDragStatusChange}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");

    act(() => {
      drag(viewport);
      onDragStatusChange.mockClear();
      fireEvent.pointerUp(viewport, { pointerType: "mouse", pointerId: 1 });
    });

    expect(onDragStatusChange).toHaveBeenCalledWith({
      type: "dragging.end",
      page: 0,
      isDragging: false,
    });
  });

  it("should call onDragStatusChange with type 'dragging.end' on pointercancel after a real drag", () => {
    const onDragStatusChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        allowMouseDrag
        onDragStatusChange={onDragStatusChange}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");

    act(() => {
      drag(viewport);
      onDragStatusChange.mockClear();
      fireEvent.pointerCancel(viewport, {
        pointerType: "mouse",
        pointerId: 1,
      });
    });

    expect(onDragStatusChange).toHaveBeenCalledWith({
      type: "dragging.end",
      page: 0,
      isDragging: false,
    });
  });

  it("should not call onDragStatusChange for a movement that never crosses the drag threshold", () => {
    const onDragStatusChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        allowMouseDrag
        onDragStatusChange={onDragStatusChange}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const viewport = screen.getByTestId("viewport");

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
        clientX: 201,
        clientY: 0,
      });
      fireEvent.pointerUp(viewport, { pointerType: "mouse", pointerId: 1 });
    });

    expect(onDragStatusChange).not.toHaveBeenCalled();
  });

  it("should report the live currentPage in the callback payload", () => {
    const onDragStatusChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        defaultPage={1}
        allowMouseDrag
        onDragStatusChange={onDragStatusChange}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    act(() => {
      drag(screen.getByTestId("viewport"));
    });

    expect(onDragStatusChange).toHaveBeenCalledWith({
      type: "dragging.start",
      page: 1,
      isDragging: true,
    });
  });
});
