import { act, fireEvent, render, screen } from "@testing-library/react";

import { Carousel } from "../index.ts";

// Autoplay status: an onAutoplayStatusChange callback mirroring Ark UI's
// shape, firing on every tick (not just play/pause toggles) so a consumer
// can react to autoplay in JS — e.g. logging analytics on each rotation.
describe("Carousel autoplay status", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should call onAutoplayStatusChange with type 'autoplay.start' as soon as the timer becomes active", () => {
    const onAutoplayStatusChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay
        defaultPlaying
        onAutoplayStatusChange={onAutoplayStatusChange}
      >
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(onAutoplayStatusChange).toHaveBeenCalledWith({
      type: "autoplay.start",
      page: 0,
      isPlaying: true,
    });
  });

  it("should call onAutoplayStatusChange with type 'autoplay' when a scheduled tick fires", () => {
    const onAutoplayStatusChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay
        defaultPlaying
        onAutoplayStatusChange={onAutoplayStatusChange}
      >
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    onAutoplayStatusChange.mockClear();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(onAutoplayStatusChange).toHaveBeenCalledWith({
      type: "autoplay",
      page: 0,
      isPlaying: true,
    });
  });

  it("should not re-emit 'autoplay.start' on ticks after the timer is already running", () => {
    const onAutoplayStatusChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay
        defaultPlaying
        onAutoplayStatusChange={onAutoplayStatusChange}
      >
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    onAutoplayStatusChange.mockClear();

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(onAutoplayStatusChange).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "autoplay.start" }),
    );
  });

  it("should call onAutoplayStatusChange with type 'autoplay.stop' when playing flips to false", () => {
    const onAutoplayStatusChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay
        defaultPlaying
        onAutoplayStatusChange={onAutoplayStatusChange}
      >
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.PlayPauseTrigger />
      </Carousel.Root>,
    );
    onAutoplayStatusChange.mockClear();

    act(() => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(onAutoplayStatusChange).toHaveBeenCalledWith({
      type: "autoplay.stop",
      page: 0,
      isPlaying: false,
    });
  });

  it("should call onAutoplayStatusChange with type 'autoplay.stop' once the last page is reached", () => {
    const onAutoplayStatusChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay
        defaultPlaying
        onAutoplayStatusChange={onAutoplayStatusChange}
      >
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    onAutoplayStatusChange.mockClear();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(onAutoplayStatusChange).toHaveBeenCalledWith({
      type: "autoplay.stop",
      page: 1,
      isPlaying: false,
    });
  });

  it("should call onAutoplayStatusChange with type 'autoplay.stop' then 'autoplay.start' across a hover pause/resume", () => {
    const onAutoplayStatusChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay
        defaultPlaying
        data-testid="carousel-root"
        onAutoplayStatusChange={onAutoplayStatusChange}
      >
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const root = screen.getByTestId("carousel-root");
    onAutoplayStatusChange.mockClear();

    act(() => {
      fireEvent.mouseEnter(root);
    });
    expect(onAutoplayStatusChange).toHaveBeenCalledWith({
      type: "autoplay.stop",
      page: 0,
      isPlaying: false,
    });

    onAutoplayStatusChange.mockClear();
    act(() => {
      fireEvent.mouseLeave(root);
    });
    expect(onAutoplayStatusChange).toHaveBeenCalledWith({
      type: "autoplay.start",
      page: 0,
      isPlaying: true,
    });
  });

  it("should never call onAutoplayStatusChange when autoplay is disabled", () => {
    const onAutoplayStatusChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        defaultPlaying
        onAutoplayStatusChange={onAutoplayStatusChange}
      >
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(onAutoplayStatusChange).not.toHaveBeenCalled();
  });

  it("should report the live active page in the callback payload", () => {
    const onAutoplayStatusChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay
        defaultPlaying
        defaultPage={1}
        onAutoplayStatusChange={onAutoplayStatusChange}
      >
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(onAutoplayStatusChange).toHaveBeenCalledWith({
      type: "autoplay.start",
      page: 1,
      isPlaying: true,
    });
  });
});
