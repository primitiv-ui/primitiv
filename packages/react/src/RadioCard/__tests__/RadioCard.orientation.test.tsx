import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RadioCard } from "../RadioCard";

describe("RadioCard orientation", () => {
  it("ignores horizontal arrows when orientation is vertical", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <RadioCard.Root
        aria-label="Plan"
        orientation="vertical"
        defaultValue="starter"
      >
        <RadioCard.Item value="starter">Starter</RadioCard.Item>
        <RadioCard.Item value="pro">Pro</RadioCard.Item>
      </RadioCard.Root>,
    );
    const starter = screen.getByRole("radio", { name: "Starter" });
    const pro = screen.getByRole("radio", { name: "Pro" });
    starter.focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert — horizontal arrows are inert on a vertical group
    expect(starter).toHaveFocus();
    expect(starter).toHaveAttribute("aria-checked", "true");
    expect(pro).toHaveAttribute("aria-checked", "false");
  });

  it("ignores vertical arrows when orientation is horizontal", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <RadioCard.Root
        aria-label="Plan"
        orientation="horizontal"
        defaultValue="starter"
      >
        <RadioCard.Item value="starter">Starter</RadioCard.Item>
        <RadioCard.Item value="pro">Pro</RadioCard.Item>
      </RadioCard.Root>,
    );
    const starter = screen.getByRole("radio", { name: "Starter" });
    const pro = screen.getByRole("radio", { name: "Pro" });
    starter.focus();

    // Act
    await user.keyboard("{ArrowDown}");

    // Assert — vertical arrows are inert on a horizontal group
    expect(starter).toHaveFocus();
    expect(starter).toHaveAttribute("aria-checked", "true");
    expect(pro).toHaveAttribute("aria-checked", "false");
  });

  it.each(["horizontal", "vertical"] as const)(
    "reflects orientation=%s via aria-orientation",
    (orientation) => {
      // Arrange
      render(
        <RadioCard.Root aria-label="Plan" orientation={orientation}>
          <RadioCard.Item value="starter">Starter</RadioCard.Item>
        </RadioCard.Root>,
      );

      // Assert
      expect(screen.getByRole("radiogroup")).toHaveAttribute(
        "aria-orientation",
        orientation,
      );
    },
  );

  it("omits aria-orientation for the default both orientation", () => {
    // Arrange
    render(
      <RadioCard.Root aria-label="Plan">
        <RadioCard.Item value="starter">Starter</RadioCard.Item>
      </RadioCard.Root>,
    );

    // Assert
    expect(screen.getByRole("radiogroup")).not.toHaveAttribute(
      "aria-orientation",
    );
  });
});
