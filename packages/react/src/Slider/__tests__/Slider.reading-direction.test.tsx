import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DirectionProvider } from "../../DirectionProvider";
import { Slider } from "../Slider";

import { rtlKeyboardCases } from "./Slider.fixtures";

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

describe("Slider reading direction", () => {
  describe.each(rtlKeyboardCases)("RTL — $name", ({ key, from, expected }) => {
    it(`moves the thumb from ${from} to ${expected}`, async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Slider.Root dir="rtl" defaultValue={[from]}>
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
  });

  it("inverts the arrow direction again when RTL is combined with inverted", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Slider.Root dir="rtl" inverted defaultValue={[50]}>
        <Slider.Thumb />
      </Slider.Root>,
    );
    const thumb = screen.getByRole("slider");
    thumb.focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(thumb).toHaveAttribute("aria-valuenow", "51");
  });

  it("maps a pointer position right-to-left", () => {
    // Arrange
    render(
      <Slider.Root dir="rtl" defaultValue={[10]} data-testid="root">
        <Slider.Thumb />
      </Slider.Root>,
    );
    const root = screen.getByTestId("root");
    root.getBoundingClientRect = () => TRACK_RECT;

    // Act
    fireEvent.pointerDown(root, { clientX: 30 });

    // Assert
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "70");
  });

  it("should inherit reading direction from a DirectionProvider", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <DirectionProvider dir="rtl">
        <Slider.Root data-testid="root" defaultValue={[50]}>
          <Slider.Thumb />
        </Slider.Root>
      </DirectionProvider>,
    );
    const thumb = screen.getByRole("slider");
    thumb.focus();

    // Assert — provider direction reaches the DOM
    expect(screen.getByTestId("root")).toHaveAttribute("dir", "rtl");

    // Act — in RTL, Arrow Right moves the thumb toward the start
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(thumb).toHaveAttribute("aria-valuenow", "49");
  });
});
