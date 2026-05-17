import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Slider } from "../Slider";

import { keyboardCases } from "./Slider.fixtures";

describe("Slider keyboard interaction", () => {
  describe.each(keyboardCases)("$key", ({ key, from, expected }) => {
    it(`moves the thumb from ${from} to ${expected}`, async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Slider.Root defaultValue={[from]}>
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

  it("moves by a custom step", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Slider.Root defaultValue={[50]} step={5}>
        <Slider.Thumb />
      </Slider.Root>,
    );
    const thumb = screen.getByRole("slider");
    thumb.focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(thumb).toHaveAttribute("aria-valuenow", "55");
  });

  it("clamps at the maximum", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Slider.Root defaultValue={[100]}>
        <Slider.Thumb />
      </Slider.Root>,
    );
    const thumb = screen.getByRole("slider");
    thumb.focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(thumb).toHaveAttribute("aria-valuenow", "100");
  });

  it("clamps at the minimum", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Slider.Root defaultValue={[0]}>
        <Slider.Thumb />
      </Slider.Root>,
    );
    const thumb = screen.getByRole("slider");
    thumb.focus();

    // Act
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(thumb).toHaveAttribute("aria-valuenow", "0");
  });

  it("snaps fractional steps to the configured precision", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Slider.Root defaultValue={[0.5]} min={0} max={1} step={0.1}>
        <Slider.Thumb />
      </Slider.Root>,
    );
    const thumb = screen.getByRole("slider");
    thumb.focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(thumb).toHaveAttribute("aria-valuenow", "0.6");
  });

  it("ignores unrelated keys", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Slider.Root defaultValue={[50]}>
        <Slider.Thumb />
      </Slider.Root>,
    );
    const thumb = screen.getByRole("slider");
    thumb.focus();

    // Act
    await user.keyboard("a");

    // Assert
    expect(thumb).toHaveAttribute("aria-valuenow", "50");
  });
});
