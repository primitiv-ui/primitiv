import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel } from "../index.ts";

describe("Carousel.PlayPauseTrigger basic shape", () => {
  it("should render the PlayPauseTrigger as <button type='button'>", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" autoplay>
        <Carousel.PlayPauseTrigger />
      </Carousel.Root>,
    );

    const trigger = screen.getByRole("button");
    expect(trigger).toBeVisible();
    expect(trigger).toHaveAttribute("type", "button");
  });

  it("should accept a className prop", () => {
    const testClass = "custom-play-pause";
    render(
      <Carousel.Root ariaLabel="Featured products" autoplay>
        <Carousel.PlayPauseTrigger className={testClass} />
      </Carousel.Root>,
    );

    expect(screen.getByRole("button")).toHaveAttribute("class", testClass);
  });

  it("should apply a className of empty string by default when not specified", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" autoplay>
        <Carousel.PlayPauseTrigger />
      </Carousel.Root>,
    );

    expect(screen.getByRole("button")).toHaveAttribute("class", "");
  });

  it("should throw an error when used outside Carousel.Root", () => {
    expect(() => {
      render(<Carousel.PlayPauseTrigger />);
    }).toThrow("Component must be rendered as a child of Carousel.Root");
  });
});

describe("Carousel.PlayPauseTrigger uncontrolled playing state", () => {
  it("should default to playing=false (paused) and announce 'Start automatic slide show'", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" autoplay>
        <Carousel.PlayPauseTrigger />
      </Carousel.Root>,
    );

    expect(
      screen.getByRole("button", { name: "Start automatic slide show" }),
    ).toBeVisible();
  });

  it("should accept defaultPlaying={true} to seed the initial playing state", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" autoplay defaultPlaying>
        <Carousel.PlayPauseTrigger />
      </Carousel.Root>,
    );

    expect(
      screen.getByRole("button", { name: "Stop automatic slide show" }),
    ).toBeVisible();
  });

  it("should toggle playing when the trigger is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products" autoplay>
        <Carousel.PlayPauseTrigger />
      </Carousel.Root>,
    );

    await user.click(
      screen.getByRole("button", { name: "Start automatic slide show" }),
    );
    expect(
      screen.getByRole("button", { name: "Stop automatic slide show" }),
    ).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "Stop automatic slide show" }),
    );
    expect(
      screen.getByRole("button", { name: "Start automatic slide show" }),
    ).toBeVisible();
  });
});

describe("Carousel.PlayPauseTrigger controlled playing state", () => {
  it("should reflect the playing prop, not internal state", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay
        playing
        onPlayingChange={() => {}}
      >
        <Carousel.PlayPauseTrigger />
      </Carousel.Root>,
    );

    expect(
      screen.getByRole("button", { name: "Stop automatic slide show" }),
    ).toBeVisible();
  });

  it("should call onPlayingChange when clicked, without updating internal state", async () => {
    const user = userEvent.setup();
    const onPlayingChange = vi.fn();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay
        playing={false}
        onPlayingChange={onPlayingChange}
      >
        <Carousel.PlayPauseTrigger />
      </Carousel.Root>,
    );

    await user.click(screen.getByRole("button"));

    expect(onPlayingChange).toHaveBeenCalledTimes(1);
    expect(onPlayingChange).toHaveBeenCalledWith(true);
    // Parent has not re-rendered with a new playing prop, so the
    // visible state must remain at the controlled value.
    expect(
      screen.getByRole("button", { name: "Start automatic slide show" }),
    ).toBeVisible();
  });

  it("should reflect external playing changes that don't go through the trigger", async () => {
    const user = userEvent.setup();
    function Parent() {
      const [playing, setPlaying] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setPlaying(true)}>
            External play
          </button>
          <Carousel.Root
            ariaLabel="Featured products"
            autoplay
            playing={playing}
            onPlayingChange={setPlaying}
          >
            <Carousel.PlayPauseTrigger />
          </Carousel.Root>
        </>
      );
    }

    render(<Parent />);

    await user.click(screen.getByRole("button", { name: "External play" }));

    expect(
      screen.getByRole("button", { name: "Stop automatic slide show" }),
    ).toBeVisible();
  });
});

describe("Carousel.PlayPauseTrigger render-prop children", () => {
  it("should pass { playing } to a function child and render its return value", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" autoplay>
        <Carousel.PlayPauseTrigger>
          {({ playing }) => (playing ? "Pause slideshow" : "Start slideshow")}
        </Carousel.PlayPauseTrigger>
      </Carousel.Root>,
    );

    expect(screen.getByRole("button")).toHaveTextContent("Start slideshow");
  });

  it("should re-render the function child when playing flips", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products" autoplay>
        <Carousel.PlayPauseTrigger>
          {({ playing }) => (playing ? "Pause slideshow" : "Start slideshow")}
        </Carousel.PlayPauseTrigger>
      </Carousel.Root>,
    );

    await user.click(screen.getByRole("button"));

    expect(screen.getByRole("button")).toHaveTextContent("Pause slideshow");
  });

  it("should render static children unchanged when no function is provided", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" autoplay>
        <Carousel.PlayPauseTrigger>
          <span data-testid="play-pause-icon" />
        </Carousel.PlayPauseTrigger>
      </Carousel.Root>,
    );

    expect(screen.getByTestId("play-pause-icon")).toBeVisible();
  });
});

describe("Carousel.PlayPauseTrigger styling hooks", () => {
  it('should emit data-state="paused" when not playing', () => {
    render(
      <Carousel.Root ariaLabel="Featured products" autoplay>
        <Carousel.PlayPauseTrigger />
      </Carousel.Root>,
    );

    expect(screen.getByRole("button")).toHaveAttribute("data-state", "paused");
  });

  it('should emit data-state="playing" when playing', () => {
    render(
      <Carousel.Root ariaLabel="Featured products" autoplay defaultPlaying>
        <Carousel.PlayPauseTrigger />
      </Carousel.Root>,
    );

    expect(screen.getByRole("button")).toHaveAttribute("data-state", "playing");
  });
});
