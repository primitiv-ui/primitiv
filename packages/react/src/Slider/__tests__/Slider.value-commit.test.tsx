import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

describe("Slider value commit", () => {
  it("commits the value after a keyboard interaction", async () => {
    // Arrange
    const user = userEvent.setup();
    const onValueCommit = vi.fn();
    render(
      <Slider.Root defaultValue={[50]} onValueCommit={onValueCommit}>
        <Slider.Thumb />
      </Slider.Root>,
    );
    screen.getByRole("slider").focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(onValueCommit).toHaveBeenCalledWith([51]);
  });

  it("does not commit when a keyboard press leaves the value unchanged", async () => {
    // Arrange
    const user = userEvent.setup();
    const onValueCommit = vi.fn();
    render(
      <Slider.Root defaultValue={[100]} onValueCommit={onValueCommit}>
        <Slider.Thumb />
      </Slider.Root>,
    );
    screen.getByRole("slider").focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(onValueCommit).not.toHaveBeenCalled();
  });

  it("commits once at the end of a pointer drag", () => {
    // Arrange
    const onValueCommit = vi.fn();
    render(
      <Slider.Root
        defaultValue={[10]}
        onValueCommit={onValueCommit}
        data-testid="root"
      >
        <Slider.Thumb />
      </Slider.Root>,
    );
    const root = screen.getByTestId("root");
    root.getBoundingClientRect = () => TRACK_RECT;

    // Act
    fireEvent.pointerDown(root, { clientX: 30 });
    fireEvent.pointerMove(document, { clientX: 55 });
    fireEvent.pointerMove(document, { clientX: 70 });
    fireEvent.pointerUp(document);

    // Assert
    expect(onValueCommit).toHaveBeenCalledTimes(1);
    expect(onValueCommit).toHaveBeenCalledWith([70]);
  });

  it("does not commit when a pointer interaction leaves the value unchanged", () => {
    // Arrange
    const onValueCommit = vi.fn();
    render(
      <Slider.Root
        defaultValue={[30]}
        onValueCommit={onValueCommit}
        data-testid="root"
      >
        <Slider.Thumb />
      </Slider.Root>,
    );
    const root = screen.getByTestId("root");
    root.getBoundingClientRect = () => TRACK_RECT;

    // Act
    fireEvent.pointerDown(root, { clientX: 30 });
    fireEvent.pointerUp(document);

    // Assert
    expect(onValueCommit).not.toHaveBeenCalled();
  });
});
