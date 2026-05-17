import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Slider } from "../Slider";

import { invertedKeyboardCases } from "./Slider.fixtures";

const HORIZONTAL_RECT = {
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

describe("Slider inverted", () => {
  describe.each(invertedKeyboardCases)(
    "$name",
    ({ orientation, key, from, expected }) => {
      it(`moves the thumb from ${from} to ${expected}`, async () => {
        // Arrange
        const user = userEvent.setup();
        render(
          <Slider.Root inverted orientation={orientation} defaultValue={[from]}>
            <Slider.Thumb />
          </Slider.Root>,
        );
        const thumb = screen.getByRole("slider");
        thumb.focus();

        // Act
        await user.keyboard(key);

        // Assert
        expect(thumb).toHaveAttribute("aria-valuenow", String(expected));
      });
    },
  );

  it("leaves a non-inverted vertical slider increasing on ArrowUp", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Slider.Root orientation="vertical" defaultValue={[50]}>
        <Slider.Thumb />
      </Slider.Root>,
    );
    const thumb = screen.getByRole("slider");
    thumb.focus();

    // Act
    await user.keyboard("{ArrowUp}");

    // Assert
    expect(thumb).toHaveAttribute("aria-valuenow", "51");
  });

  it("maps an inverted horizontal pointer position", () => {
    // Arrange
    render(
      <Slider.Root inverted defaultValue={[10]} data-testid="root">
        <Slider.Thumb />
      </Slider.Root>,
    );
    const root = screen.getByTestId("root");
    root.getBoundingClientRect = () => HORIZONTAL_RECT;

    // Act
    fireEvent.pointerDown(root, { clientX: 30 });

    // Assert
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "70");
  });

  it("maps an inverted vertical pointer position", () => {
    // Arrange
    render(
      <Slider.Root
        inverted
        orientation="vertical"
        defaultValue={[10]}
        data-testid="root"
      >
        <Slider.Thumb />
      </Slider.Root>,
    );
    const root = screen.getByTestId("root");
    root.getBoundingClientRect = () => VERTICAL_RECT;

    // Act
    fireEvent.pointerDown(root, { clientY: 30 });

    // Assert
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "30");
  });
});
