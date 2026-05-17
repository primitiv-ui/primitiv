import { render, screen } from "@testing-library/react";

import { Slider } from "../Slider";

describe("Slider basic rendering", () => {
  it("renders a thumb with role=slider", () => {
    // Arrange & Act
    render(
      <Slider.Root defaultValue={[50]}>
        <Slider.Track>
          <Slider.Range />
        </Slider.Track>
        <Slider.Thumb />
      </Slider.Root>,
    );

    // Assert
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it('marks the root with data-orientation="horizontal" by default', () => {
    // Arrange & Act
    render(
      <Slider.Root defaultValue={[50]} data-testid="root">
        <Slider.Thumb />
      </Slider.Root>,
    );

    // Assert
    expect(screen.getByTestId("root")).toHaveAttribute(
      "data-orientation",
      "horizontal",
    );
  });

  it('renders the root as a <span dir="ltr">', () => {
    // Arrange & Act
    render(
      <Slider.Root defaultValue={[50]} data-testid="root">
        <Slider.Thumb />
      </Slider.Root>,
    );

    // Assert
    const root = screen.getByTestId("root");
    expect(root.tagName).toBe("SPAN");
    expect(root).toHaveAttribute("dir", "ltr");
  });

  it("renders Track and Range as spans carrying data-orientation", () => {
    // Arrange & Act
    render(
      <Slider.Root defaultValue={[50]}>
        <Slider.Track data-testid="track">
          <Slider.Range data-testid="range" />
        </Slider.Track>
        <Slider.Thumb />
      </Slider.Root>,
    );

    // Assert
    const track = screen.getByTestId("track");
    const range = screen.getByTestId("range");
    expect(track.tagName).toBe("SPAN");
    expect(track).toHaveAttribute("data-orientation", "horizontal");
    expect(range).toHaveAttribute("data-orientation", "horizontal");
  });

  it("gives the thumb tabIndex 0 and aria-orientation", () => {
    // Arrange & Act
    render(
      <Slider.Root defaultValue={[50]}>
        <Slider.Thumb />
      </Slider.Root>,
    );

    // Assert
    const thumb = screen.getByRole("slider");
    expect(thumb).toHaveAttribute("tabindex", "0");
    expect(thumb).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("exposes the default 0–100 range and current value on the thumb", () => {
    // Arrange & Act
    render(
      <Slider.Root defaultValue={[50]}>
        <Slider.Thumb />
      </Slider.Root>,
    );

    // Assert
    const thumb = screen.getByRole("slider");
    expect(thumb).toHaveAttribute("aria-valuemin", "0");
    expect(thumb).toHaveAttribute("aria-valuemax", "100");
    expect(thumb).toHaveAttribute("aria-valuenow", "50");
  });

  it("reflects a custom min and max on the thumb", () => {
    // Arrange & Act
    render(
      <Slider.Root defaultValue={[5]} min={0} max={10}>
        <Slider.Thumb />
      </Slider.Root>,
    );

    // Assert
    const thumb = screen.getByRole("slider");
    expect(thumb).toHaveAttribute("aria-valuemin", "0");
    expect(thumb).toHaveAttribute("aria-valuemax", "10");
    expect(thumb).toHaveAttribute("aria-valuenow", "5");
  });

  it("defaults the single thumb to min when no value is given", () => {
    // Arrange & Act
    render(
      <Slider.Root min={10} max={20}>
        <Slider.Thumb />
      </Slider.Root>,
    );

    // Assert
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "10");
  });

  it("positions the thumb along the track via an inline percentage offset", () => {
    // Arrange & Act
    render(
      <Slider.Root defaultValue={[25]}>
        <Slider.Thumb data-testid="thumb" />
      </Slider.Root>,
    );

    // Assert
    expect(screen.getByTestId("thumb")).toHaveStyle({
      position: "absolute",
      left: "25%",
    });
  });

  it("stretches the range from the track start to the thumb", () => {
    // Arrange & Act
    render(
      <Slider.Root defaultValue={[40]}>
        <Slider.Track>
          <Slider.Range data-testid="range" />
        </Slider.Track>
        <Slider.Thumb />
      </Slider.Root>,
    );

    // Assert
    expect(screen.getByTestId("range")).toHaveStyle({
      left: "0%",
      right: "60%",
    });
  });
});
