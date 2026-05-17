import { fireEvent, render, screen } from "@testing-library/react";

import { Slider } from "../Slider";

const TRACK_RECT = {
  left: 0,
  top: 0,
  right: 100,
  bottom: 10,
  width: 100,
  height: 10,
  x: 0,
  y: 0,
  toJSON: () => ({}),
} as DOMRect;

describe("Slider disabled", () => {
  it("marks the root, track, range and thumb with data-disabled", () => {
    // Arrange & Act
    render(
      <Slider.Root defaultValue={[50]} disabled data-testid="root">
        <Slider.Track data-testid="track">
          <Slider.Range data-testid="range" />
        </Slider.Track>
        <Slider.Thumb />
      </Slider.Root>,
    );

    // Assert
    expect(screen.getByTestId("root")).toHaveAttribute("data-disabled", "");
    expect(screen.getByTestId("track")).toHaveAttribute("data-disabled", "");
    expect(screen.getByTestId("range")).toHaveAttribute("data-disabled", "");
    expect(screen.getByRole("slider")).toHaveAttribute("data-disabled", "");
  });

  it("marks the thumb aria-disabled and removes it from the tab order", () => {
    // Arrange & Act
    render(
      <Slider.Root defaultValue={[50]} disabled>
        <Slider.Thumb />
      </Slider.Root>,
    );

    // Assert
    const thumb = screen.getByRole("slider");
    expect(thumb).toHaveAttribute("aria-disabled", "true");
    expect(thumb).not.toHaveAttribute("tabindex");
  });

  it("ignores keyboard interaction while disabled", () => {
    // Arrange
    render(
      <Slider.Root defaultValue={[50]} disabled>
        <Slider.Thumb />
      </Slider.Root>,
    );
    const thumb = screen.getByRole("slider");

    // Act
    fireEvent.keyDown(thumb, { key: "ArrowRight" });

    // Assert
    expect(thumb).toHaveAttribute("aria-valuenow", "50");
  });

  it("ignores pointer interaction while disabled", () => {
    // Arrange
    render(
      <Slider.Root defaultValue={[50]} disabled data-testid="root">
        <Slider.Thumb />
      </Slider.Root>,
    );
    const root = screen.getByTestId("root");
    root.getBoundingClientRect = () => TRACK_RECT;

    // Act
    fireEvent.pointerDown(root, { clientX: 90 });

    // Assert
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "50");
  });
});
