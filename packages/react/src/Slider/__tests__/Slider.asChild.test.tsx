import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Slider } from "../Slider";

describe("Slider asChild", () => {
  it("renders Slider.Root as a consumer-supplied element", () => {
    // Arrange & Act
    render(
      <Slider.Root asChild defaultValue={[50]}>
        <div data-testid="root">
          <Slider.Thumb />
        </div>
      </Slider.Root>,
    );

    // Assert
    const root = screen.getByTestId("root");
    expect(root.tagName).toBe("DIV");
    expect(root).toHaveAttribute("data-orientation", "horizontal");
  });

  it("renders Slider.Track and Slider.Range as consumer-supplied elements", () => {
    // Arrange & Act
    render(
      <Slider.Root defaultValue={[40]}>
        <Slider.Track asChild>
          <div data-testid="track">
            <Slider.Range asChild>
              <div data-testid="range" />
            </Slider.Range>
          </div>
        </Slider.Track>
        <Slider.Thumb />
      </Slider.Root>,
    );

    // Assert
    expect(screen.getByTestId("track").tagName).toBe("DIV");
    expect(screen.getByTestId("range").tagName).toBe("DIV");
    expect(screen.getByTestId("range")).toHaveStyle({ right: "60%" });
  });

  it("renders Slider.Thumb as a consumer-supplied element with the slider role", () => {
    // Arrange & Act
    render(
      <Slider.Root defaultValue={[50]}>
        <Slider.Thumb asChild>
          <div data-testid="thumb" />
        </Slider.Thumb>
      </Slider.Root>,
    );

    // Assert
    const thumb = screen.getByRole("slider");
    expect(thumb).toBe(screen.getByTestId("thumb"));
    expect(thumb).toHaveAttribute("aria-valuenow", "50");
  });

  it("keeps keyboard interaction working on an asChild thumb", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Slider.Root defaultValue={[50]}>
        <Slider.Thumb asChild>
          <div />
        </Slider.Thumb>
      </Slider.Root>,
    );
    const thumb = screen.getByRole("slider");
    thumb.focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(thumb).toHaveAttribute("aria-valuenow", "51");
  });

  it("forwards a ref through an asChild thumb", () => {
    // Arrange
    const ref = createRef<HTMLDivElement>();

    // Act
    render(
      <Slider.Root defaultValue={[50]}>
        <Slider.Thumb asChild>
          <div ref={ref} />
        </Slider.Thumb>
      </Slider.Root>,
    );

    // Assert
    expect(ref.current).toBe(screen.getByRole("slider"));
  });

  it("composes the consumer's onKeyDown on an asChild thumb", async () => {
    // Arrange
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(
      <Slider.Root defaultValue={[50]}>
        <Slider.Thumb asChild>
          <div onKeyDown={onKeyDown} />
        </Slider.Thumb>
      </Slider.Root>,
    );
    const thumb = screen.getByRole("slider");
    thumb.focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(thumb).toHaveAttribute("aria-valuenow", "51");
  });
});
