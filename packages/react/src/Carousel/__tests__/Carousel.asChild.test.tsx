import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel } from "../index.ts";

describe("Carousel.NextTrigger asChild", () => {
  it("should render the supplied child element and route the click through to the page-advance handler", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products" autoplay>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
        <Carousel.NextTrigger asChild>
          <a href="#next" data-testid="next">Next</a>
        </Carousel.NextTrigger>
      </Carousel.Root>,
    );

    const link = screen.getByTestId("next");
    expect(link.tagName).toBe("A");
    // No wrapping default <button> — asChild replaced the trigger's
    // rendered element with the consumer's child.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    await user.click(link);

    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should respect the boundary clamp even when asChild is on a non-button", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products" defaultPage={1}>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
        <Carousel.NextTrigger asChild>
          <a href="#next" data-testid="next">Next</a>
        </Carousel.NextTrigger>
      </Carousel.Root>,
    );

    // No wrapping <button> means HTML `disabled` can't block the click —
    // the click-handler guard inside NextTrigger is the only thing
    // preventing navigation here.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("next"));

    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
  });
});

describe("Carousel.PreviousTrigger asChild", () => {
  it("should render the supplied child element and route the click through to the page-retreat handler", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products" defaultPage={1}>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
        <Carousel.PreviousTrigger asChild>
          <a href="#prev" data-testid="prev">Previous</a>
        </Carousel.PreviousTrigger>
      </Carousel.Root>,
    );

    const link = screen.getByTestId("prev");
    expect(link.tagName).toBe("A");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    await user.click(link);

    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should respect the boundary clamp at the first slide when asChild is on a non-button", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products" autoplay>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
        <Carousel.PreviousTrigger asChild>
          <a href="#prev" data-testid="prev">Previous</a>
        </Carousel.PreviousTrigger>
      </Carousel.Root>,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("prev"));

    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );
  });
});

describe("Carousel.PlayPauseTrigger asChild", () => {
  it("should render the supplied child element and route the click through to togglePlaying", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products" autoplay>
        <Carousel.PlayPauseTrigger asChild>
          <span role="button" tabIndex={0} data-testid="play-pause">
            ▶
          </span>
        </Carousel.PlayPauseTrigger>
      </Carousel.Root>,
    );

    const trigger = screen.getByTestId("play-pause");
    expect(trigger.tagName).toBe("SPAN");
    expect(trigger).toHaveAttribute(
      "aria-label",
      "Start automatic slide show",
    );

    await user.click(trigger);

    expect(trigger).toHaveAttribute(
      "aria-label",
      "Stop automatic slide show",
    );
  });
});

describe("Carousel.Indicator asChild", () => {
  it("should render the supplied child element and route the click through to goTo", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products" autoplay>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
        <Carousel.IndicatorGroup label="Choose">
          <Carousel.Indicator index={0} />
          <Carousel.Indicator index={1} />
          <Carousel.Indicator index={2} asChild>
            <a href="#slide-3" data-testid="indicator-2">
              3
            </a>
          </Carousel.Indicator>
        </Carousel.IndicatorGroup>
      </Carousel.Root>,
    );

    const link = screen.getByTestId("indicator-2");
    expect(link.tagName).toBe("A");
    // 3 indicators total but only 2 buttons — the third is asChild as <a>.
    expect(screen.getAllByRole("button")).toHaveLength(2);

    await user.click(link);

    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "active",
    );
  });
});
