import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DirectionProvider } from "../../DirectionProvider";
import { RadioCard } from "../RadioCard";

describe("RadioCard reading direction", () => {
  it("inverts horizontal arrows when dir is rtl", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <RadioCard.Root
        aria-label="Plan"
        orientation="horizontal"
        dir="rtl"
        defaultValue="starter"
      >
        <RadioCard.Item value="starter">Starter</RadioCard.Item>
        <RadioCard.Item value="pro">Pro</RadioCard.Item>
        <RadioCard.Item value="team">Team</RadioCard.Item>
      </RadioCard.Root>,
    );
    const pro = screen.getByRole("radio", { name: "Pro" });
    screen.getByRole("radio", { name: "Starter" }).focus();

    // Assert — dir reaches the DOM
    expect(screen.getByRole("radiogroup")).toHaveAttribute("dir", "rtl");

    // Act — in RTL, Arrow Left moves forward
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(pro).toHaveFocus();
    expect(pro).toHaveAttribute("aria-checked", "true");
  });

  it("inherits reading direction from a DirectionProvider", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <DirectionProvider dir="rtl">
        <RadioCard.Root
          aria-label="Plan"
          orientation="horizontal"
          defaultValue="starter"
        >
          <RadioCard.Item value="starter">Starter</RadioCard.Item>
          <RadioCard.Item value="pro">Pro</RadioCard.Item>
          <RadioCard.Item value="team">Team</RadioCard.Item>
        </RadioCard.Root>
      </DirectionProvider>,
    );
    const pro = screen.getByRole("radio", { name: "Pro" });
    screen.getByRole("radio", { name: "Starter" }).focus();

    // Assert — provider direction reaches the DOM
    expect(screen.getByRole("radiogroup")).toHaveAttribute("dir", "rtl");

    // Act — in RTL, Arrow Left moves forward
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(pro).toHaveFocus();
  });
});
