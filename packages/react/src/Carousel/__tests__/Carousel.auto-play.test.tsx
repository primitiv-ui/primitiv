import { act, fireEvent, render, screen } from "@testing-library/react";

import { Carousel } from "..";

describe("Carousel autoplay timer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should advance the active page after 4000ms when autoplay={true} and playing is true", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" autoplay defaultPlaying>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should accept a custom delay via autoplay={{ delay: 1000 }}", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay={{ delay: 1000 }}
        defaultPlaying
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should react to autoplay being toggled on at runtime via re-render", () => {
    const { rerender } = render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay={false}
        defaultPlaying
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );

    rerender(
      <Carousel.Root ariaLabel="Featured products" autoplay defaultPlaying>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should not advance when autoplay is enabled but playing flips on later via parent state", () => {
    function Parent({ playing }: { playing: boolean }) {
      return (
        <Carousel.Root
          ariaLabel="Featured products"
          autoplay
          playing={playing}
          onPlayingChange={() => {}}
        >
          <Carousel.Viewport>
            <Carousel.Slide data-testid="slide-0" />
            <Carousel.Slide data-testid="slide-1" />
          </Carousel.Viewport>
        </Carousel.Root>
      );
    }

    const { rerender } = render(<Parent playing={false} />);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );

    rerender(<Parent playing={true} />);

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should advance repeatedly across multiple delay intervals", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" autoplay defaultPlaying>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should stop advancing once the active page reaches the last slide", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay
        defaultPlaying
        defaultPage={0}
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );

    // Already at last; further ticks are no-ops.
    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should pause the timer while the Root is hovered, then resume on mouseleave", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay
        defaultPlaying
        data-testid="carousel-root"
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    const root = screen.getByTestId("carousel-root");
    act(() => {
      fireEvent.mouseEnter(root);
    });

    // Hovered: timer paused, no advance.
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );

    // Mouseleave resumes — first tick fires after the resolved delay.
    act(() => {
      fireEvent.mouseLeave(root);
    });
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should pause the timer while focus is inside the Root, then resume on focus leaving", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay
        defaultPlaying
        data-testid="carousel-root"
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    const button = screen.getByRole("button", { name: "Next" });
    act(() => {
      fireEvent.focus(button);
    });

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );

    // Blur out of the carousel entirely (no relatedTarget within Root).
    act(() => {
      fireEvent.blur(button, { relatedTarget: document.body });
    });
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should stay paused if focus moves between descendants of the Root", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay
        defaultPlaying
        data-testid="carousel-root"
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
        <Carousel.PreviousTrigger>Previous</Carousel.PreviousTrigger>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    const prev = screen.getByRole("button", { name: "Previous" });
    const next = screen.getByRole("button", { name: "Next" });
    act(() => {
      fireEvent.focus(next);
    });

    // Move focus from Next to Prev — both inside Root, so still paused.
    act(() => {
      fireEvent.blur(next, { relatedTarget: prev });
      fireEvent.focus(prev);
    });

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should remain paused while either hover or focus is present, and resume only after both are gone", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay
        defaultPlaying
        data-testid="carousel-root"
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    const root = screen.getByTestId("carousel-root");
    const button = screen.getByRole("button", { name: "Next" });

    act(() => {
      fireEvent.mouseEnter(root);
      fireEvent.focus(button);
    });

    // Both engaged: paused.
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );

    // Lose hover but keep focus: still paused.
    act(() => {
      fireEvent.mouseLeave(root);
    });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );

    // Lose focus too: resumes.
    act(() => {
      fireEvent.blur(button, { relatedTarget: document.body });
    });
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should ignore hover-pause after the user explicitly resumes via PlayPauseTrigger", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay
        data-testid="carousel-root"
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
        <Carousel.PlayPauseTrigger />
      </Carousel.Root>,
    );

    const root = screen.getByTestId("carousel-root");
    const button = screen.getByRole("button");

    // Pointer is already on the carousel when the user explicitly
    // starts the slideshow — the WAI-ARIA APG example dismisses the
    // hover-pause for this playing session.
    act(() => {
      fireEvent.mouseEnter(root);
    });
    act(() => {
      fireEvent.click(button);
    });

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should ignore focus-pause after the user explicitly resumes via PlayPauseTrigger", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" autoplay>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
        <Carousel.PlayPauseTrigger />
      </Carousel.Root>,
    );

    const button = screen.getByRole("button");

    // Focusing the play/pause trigger before click already moves focus
    // inside the Root.
    act(() => {
      fireEvent.focus(button);
      fireEvent.click(button);
    });

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should re-engage hover-pause after the user pauses and then resumes a second time", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay
        data-testid="carousel-root"
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
        <Carousel.PlayPauseTrigger />
      </Carousel.Root>,
    );

    const root = screen.getByTestId("carousel-root");
    const button = screen.getByRole("button");

    // First user-initiated play with hover already engaged.
    act(() => {
      fireEvent.mouseEnter(root);
      fireEvent.click(button);
    });
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );

    // User pauses — flag should reset.
    act(() => {
      fireEvent.click(button);
    });

    // User starts playing again, still hovered. The flag must have been
    // reset by the pause so the next play is also "user-initiated" and
    // bypasses hover-pause for this fresh session.
    act(() => {
      fireEvent.click(button);
    });
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should default the Viewport's aria-live to 'polite' when autoplay is not enabled", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport" />
      </Carousel.Root>,
    );

    expect(screen.getByTestId("viewport")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("should set the Viewport's aria-live to 'off' while autoplay is enabled and playing is true", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" autoplay defaultPlaying>
        <Carousel.Viewport data-testid="viewport" />
      </Carousel.Root>,
    );

    expect(screen.getByTestId("viewport")).toHaveAttribute("aria-live", "off");
  });

  it("should keep the Viewport's aria-live as 'polite' when autoplay is enabled but playing is false", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" autoplay>
        <Carousel.Viewport data-testid="viewport" />
      </Carousel.Root>,
    );

    expect(screen.getByTestId("viewport")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("should flip the Viewport's aria-live as playing toggles via PlayPauseTrigger", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" autoplay>
        <Carousel.Viewport data-testid="viewport" />
        <Carousel.PlayPauseTrigger />
      </Carousel.Root>,
    );

    const viewport = screen.getByTestId("viewport");
    expect(viewport).toHaveAttribute("aria-live", "polite");

    act(() => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(viewport).toHaveAttribute("aria-live", "off");

    act(() => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(viewport).toHaveAttribute("aria-live", "polite");
  });

  it("should keep the Viewport's aria-live as 'polite' when autoplay={false} even if playing is true", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay={false}
        defaultPlaying
      >
        <Carousel.Viewport data-testid="viewport" />
      </Carousel.Root>,
    );

    expect(screen.getByTestId("viewport")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("should stop the timer when playing flips to false", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" autoplay defaultPlaying>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
        <Carousel.PlayPauseTrigger />
      </Carousel.Root>,
    );

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );

    // User pauses via the play/pause trigger — timer must not fire any
    // further ticks. fireEvent is used here because userEvent's async
    // machinery interacts poorly with vitest fake timers.
    act(() => {
      fireEvent.click(screen.getByRole("button"));
    });

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
  });
});
