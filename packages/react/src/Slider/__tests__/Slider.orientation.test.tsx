import { fireEvent, render, screen } from "@testing-library/react";

import { Slider } from "../Slider";

const VERTICAL_RECT = {
  left: 0,
  top: 0,
  right: 10,
  bottom: 100,
  width: 10,
  height: 100,
  x: 0,
  y: 0,
  toJSON: () => ({}),
} as DOMRect;

describe("Slider orientation", () => {
  it('marks a vertical slider with data-orientation="vertical"', () => {
    // Arrange & Act
    render(
      <Slider.Root defaultValue={[50]} orientation="vertical" data-testid="root">
        <Slider.Thumb />
      </Slider.Root>,
    );

    // Assert
    expect(screen.getByTestId("root")).toHaveAttribute(
      "data-orientation",
      "vertical",
    );
    expect(screen.getByRole("slider")).toHaveAttribute(
      "aria-orientation",
      "vertical",
    );
  });

  it("positions a vertical thumb from the bottom edge", () => {
    // Arrange & Act
    render(
      <Slider.Root defaultValue={[25]} orientation="vertical">
        <Slider.Thumb data-testid="thumb" />
      </Slider.Root>,
    );

    // Assert
    expect(screen.getByTestId("thumb")).toHaveStyle({ bottom: "25%" });
  });

  it("stretches a vertical range along the bottom edge", () => {
    // Arrange & Act
    render(
      <Slider.Root defaultValue={[40]} orientation="vertical">
        <Slider.Track>
          <Slider.Range data-testid="range" />
        </Slider.Track>
        <Slider.Thumb />
      </Slider.Root>,
    );

    // Assert
    expect(screen.getByTestId("range")).toHaveStyle({
      bottom: "0%",
      top: "60%",
    });
  });

  it("maps a pointer's vertical position to a value", () => {
    // Arrange
    render(
      <Slider.Root defaultValue={[10]} orientation="vertical" data-testid="root">
        <Slider.Thumb />
      </Slider.Root>,
    );
    const root = screen.getByTestId("root");
    root.getBoundingClientRect = () => VERTICAL_RECT;

    // Act
    fireEvent.pointerDown(root, { clientY: 30 });

    // Assert
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "70");
  });

  it("drags a vertical thumb as the pointer moves", () => {
    // Arrange
    render(
      <Slider.Root defaultValue={[10]} orientation="vertical" data-testid="root">
        <Slider.Thumb />
      </Slider.Root>,
    );
    const root = screen.getByTestId("root");
    root.getBoundingClientRect = () => VERTICAL_RECT;

    // Act
    fireEvent.pointerDown(root, { clientY: 30 });
    fireEvent.pointerMove(document, { clientY: 80 });

    // Assert
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "20");
  });
});
