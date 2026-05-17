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

function mockTrack(element: HTMLElement) {
  element.getBoundingClientRect = () => TRACK_RECT;
}

describe("Slider pointer interaction", () => {
  it("jumps the thumb to the pointer position on pointer down", () => {
    // Arrange
    render(
      <Slider.Root defaultValue={[10]} data-testid="root">
        <Slider.Thumb />
      </Slider.Root>,
    );
    const root = screen.getByTestId("root");
    mockTrack(root);

    // Act
    fireEvent.pointerDown(root, { clientX: 30 });

    // Assert
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "30");
  });

  it("drags the thumb while the pointer moves", () => {
    // Arrange
    render(
      <Slider.Root defaultValue={[10]} data-testid="root">
        <Slider.Thumb />
      </Slider.Root>,
    );
    const root = screen.getByTestId("root");
    mockTrack(root);

    // Act
    fireEvent.pointerDown(root, { clientX: 30 });
    fireEvent.pointerMove(document, { clientX: 65 });

    // Assert
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "65");
  });

  it("stops dragging after pointer up", () => {
    // Arrange
    render(
      <Slider.Root defaultValue={[10]} data-testid="root">
        <Slider.Thumb />
      </Slider.Root>,
    );
    const root = screen.getByTestId("root");
    mockTrack(root);

    // Act
    fireEvent.pointerDown(root, { clientX: 30 });
    fireEvent.pointerUp(document);
    fireEvent.pointerMove(document, { clientX: 90 });

    // Assert
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "30");
  });

  it("moves the thumb closest to the pointer", () => {
    // Arrange
    render(
      <Slider.Root defaultValue={[20, 80]} data-testid="root">
        <Slider.Thumb />
        <Slider.Thumb />
      </Slider.Root>,
    );
    const root = screen.getByTestId("root");
    mockTrack(root);

    // Act
    fireEvent.pointerDown(root, { clientX: 70 });

    // Assert
    const [lower, upper] = screen.getAllByRole("slider");
    expect(lower).toHaveAttribute("aria-valuenow", "20");
    expect(upper).toHaveAttribute("aria-valuenow", "70");
  });

  it("moves the lower thumb when the pointer is nearer to it", () => {
    // Arrange
    render(
      <Slider.Root defaultValue={[20, 80]} data-testid="root">
        <Slider.Thumb />
        <Slider.Thumb />
      </Slider.Root>,
    );
    const root = screen.getByTestId("root");
    mockTrack(root);

    // Act
    fireEvent.pointerDown(root, { clientX: 25 });

    // Assert
    const [lower, upper] = screen.getAllByRole("slider");
    expect(lower).toHaveAttribute("aria-valuenow", "25");
    expect(upper).toHaveAttribute("aria-valuenow", "80");
  });

  it("ignores a pointer move that does not change the value", () => {
    // Arrange
    render(
      <Slider.Root defaultValue={[30]} data-testid="root">
        <Slider.Thumb />
      </Slider.Root>,
    );
    const root = screen.getByTestId("root");
    mockTrack(root);

    // Act
    fireEvent.pointerDown(root, { clientX: 30 });
    fireEvent.pointerMove(document, { clientX: 30 });
    fireEvent.pointerUp(document);

    // Assert
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "30");
  });

  it("focuses the thumb it activates", () => {
    // Arrange
    render(
      <Slider.Root defaultValue={[10]} data-testid="root">
        <Slider.Thumb />
      </Slider.Root>,
    );
    const root = screen.getByTestId("root");
    mockTrack(root);

    // Act
    fireEvent.pointerDown(root, { clientX: 30 });

    // Assert
    expect(screen.getByRole("slider")).toHaveFocus();
  });

  it("snaps a pointer position to the nearest step", () => {
    // Arrange
    render(
      <Slider.Root defaultValue={[0]} step={10} data-testid="root">
        <Slider.Thumb />
      </Slider.Root>,
    );
    const root = screen.getByTestId("root");
    mockTrack(root);

    // Act
    fireEvent.pointerDown(root, { clientX: 34 });

    // Assert
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "30");
  });

  it("clamps a pointer position beyond the track", () => {
    // Arrange
    render(
      <Slider.Root defaultValue={[10]} data-testid="root">
        <Slider.Thumb />
      </Slider.Root>,
    );
    const root = screen.getByTestId("root");
    mockTrack(root);

    // Act
    fireEvent.pointerDown(root, { clientX: 140 });

    // Assert
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "100");
  });

  it("detaches drag listeners when unmounted mid-drag", () => {
    // Arrange
    const { unmount } = render(
      <Slider.Root defaultValue={[10]} data-testid="root">
        <Slider.Thumb />
      </Slider.Root>,
    );
    const root = screen.getByTestId("root");
    mockTrack(root);
    fireEvent.pointerDown(root, { clientX: 30 });

    // Act
    unmount();

    // Assert
    expect(() =>
      fireEvent.pointerMove(document, { clientX: 80 }),
    ).not.toThrow();
  });
});
