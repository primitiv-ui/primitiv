import { createRef, useRef } from "react";
import { act, render, screen } from "@testing-library/react";

import { Carousel } from "../index.ts";
import type { CarouselImperativeApi } from "../index.ts";

function ImperativeFixture({
  apiRef,
  defaultPage,
  defaultPlaying,
}: {
  apiRef: React.Ref<CarouselImperativeApi>;
  defaultPage?: number;
  defaultPlaying?: boolean;
}) {
  return (
    <Carousel.Root ref={apiRef} ariaLabel="Featured products" autoplay defaultPage={defaultPage} defaultPlaying={defaultPlaying}>
      <Carousel.Viewport>
        <Carousel.Slide data-testid="slide-0" />
        <Carousel.Slide data-testid="slide-1" />
        <Carousel.Slide data-testid="slide-2" />
      </Carousel.Viewport>
      <Carousel.PlayPauseTrigger data-testid="play-pause" />
    </Carousel.Root>
  );
}

describe("Carousel imperative API", () => {
  it("should expose next() that advances the active page", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(<ImperativeFixture apiRef={ref} />);

    act(() => {
      ref.current!.next();
    });

    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should expose previous() that retreats the active page", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(<ImperativeFixture apiRef={ref} defaultPage={2} />);

    act(() => {
      ref.current!.previous();
    });

    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should make next() a no-op on the last page", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(<ImperativeFixture apiRef={ref} defaultPage={2} />);

    act(() => {
      ref.current!.next();
    });

    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should make previous() a no-op on the first page", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(<ImperativeFixture apiRef={ref} />);

    act(() => {
      ref.current!.previous();
    });

    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should expose goTo(page) that jumps directly to the target page", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(<ImperativeFixture apiRef={ref} />);

    act(() => {
      ref.current!.goTo(2);
    });

    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should expose play() that flips playing to true", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(<ImperativeFixture apiRef={ref} />);

    expect(screen.getByTestId("play-pause")).toHaveAttribute(
      "aria-label",
      "Start automatic slide show",
    );

    act(() => {
      ref.current!.play();
    });

    expect(screen.getByTestId("play-pause")).toHaveAttribute(
      "aria-label",
      "Stop automatic slide show",
    );
  });

  it("should expose pause() that flips playing to false", () => {
    const ref = createRef<CarouselImperativeApi>();
    render(<ImperativeFixture apiRef={ref} defaultPlaying />);

    expect(screen.getByTestId("play-pause")).toHaveAttribute(
      "aria-label",
      "Stop automatic slide show",
    );

    act(() => {
      ref.current!.pause();
    });

    expect(screen.getByTestId("play-pause")).toHaveAttribute(
      "aria-label",
      "Start automatic slide show",
    );
  });

  it("should route imperative pause() through onPlayingChange in controlled mode", () => {
    const onPlayingChange = vi.fn();
    function Parent() {
      const ref = useRef<CarouselImperativeApi>(null);
      return (
        <>
          <button
            type="button"
            onClick={() => ref.current?.pause()}
            data-testid="external-pause"
          >
            Pause
          </button>
          <Carousel.Root
            ref={ref}
            ariaLabel="Featured products"
            autoplay
            playing={true}
            onPlayingChange={onPlayingChange}
          />
        </>
      );
    }

    render(<Parent />);

    act(() => {
      screen.getByTestId("external-pause").click();
    });

    expect(onPlayingChange).toHaveBeenCalledWith(false);
  });

  it("should route imperative goTo through onPageChange in controlled mode without mutating internal state", () => {
    const onPageChange = vi.fn();
    function Parent() {
      const ref = useRef<CarouselImperativeApi>(null);
      return (
        <>
          <button
            type="button"
            onClick={() => ref.current?.goTo(2)}
            data-testid="external-jump"
          >
            Jump
          </button>
          <Carousel.Root
            ref={ref}
            ariaLabel="Featured products"
            page={0}
            onPageChange={onPageChange}
          >
            <Carousel.Viewport>
              <Carousel.Slide data-testid="slide-0" />
              <Carousel.Slide data-testid="slide-1" />
              <Carousel.Slide data-testid="slide-2" />
            </Carousel.Viewport>
          </Carousel.Root>
        </>
      );
    }

    render(<Parent />);

    act(() => {
      screen.getByTestId("external-jump").click();
    });

    expect(onPageChange).toHaveBeenCalledWith(2);
    // Parent didn't re-render with a new page prop, so the visible
    // active slide is still slide-0.
    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );
  });
});
