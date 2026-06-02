import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel } from "..";

describe("Carousel scroll sync (programmatic page change)", () => {
  it("should call scrollIntoView on the first slide of the target page when the active page changes", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    const scrollIntoViewSpy = vi.spyOn(
      screen.getByTestId("slide-1"),
      "scrollIntoView",
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(scrollIntoViewSpy).toHaveBeenCalled();
  });

  it("should scroll the target slide into view with inline:'start' and block:'nearest' by default", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
        <Carousel.IndicatorGroup label="Choose">
          <Carousel.Indicator index={0} />
          <Carousel.Indicator index={1} />
          <Carousel.Indicator index={2} />
        </Carousel.IndicatorGroup>
      </Carousel.Root>,
    );

    const scrollIntoViewSpy = vi.spyOn(
      screen.getByTestId("slide-2"),
      "scrollIntoView",
    );

    await user.click(screen.getByRole("button", { name: "Slide 3" }));

    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });
  });

  it("should target the first slide of a multi-slide page", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products" slidesPerPage={2}>
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
          <Carousel.Slide data-testid="slide-3" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    // Page 0 → page 1 means the first visible slide becomes slide 2
    // (index = page * slidesPerPage).
    const scrollIntoViewSpy = vi.spyOn(
      screen.getByTestId("slide-2"),
      "scrollIntoView",
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(scrollIntoViewSpy).toHaveBeenCalled();
  });

  it("should scroll with inline:'center' when snapAlign is 'center'", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products" snapAlign="center">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    const scrollIntoViewSpy = vi.spyOn(
      screen.getByTestId("slide-1"),
      "scrollIntoView",
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(scrollIntoViewSpy).toHaveBeenCalledWith(
      expect.objectContaining({ inline: "center" }),
    );
  });
});
