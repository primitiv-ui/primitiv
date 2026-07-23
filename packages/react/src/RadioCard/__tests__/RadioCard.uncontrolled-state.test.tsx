import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RadioCard } from "../RadioCard";

describe("RadioCard uncontrolled state", () => {
  it("selects an item on mount when defaultValue is provided", () => {
    // Arrange & Act
    render(
      <RadioCard.Root aria-label="Plan" defaultValue="pro">
        <RadioCard.Item value="starter">Starter</RadioCard.Item>
        <RadioCard.Item value="pro">Pro</RadioCard.Item>
      </RadioCard.Root>,
    );

    // Assert
    expect(screen.getByRole("radio", { name: "Pro" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "Starter" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("nothing is selected on mount when defaultValue is omitted", () => {
    // Arrange & Act
    render(
      <RadioCard.Root aria-label="Plan">
        <RadioCard.Item value="starter">Starter</RadioCard.Item>
        <RadioCard.Item value="pro">Pro</RadioCard.Item>
      </RadioCard.Root>,
    );

    // Assert
    expect(screen.getByRole("radio", { name: "Starter" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(screen.getByRole("radio", { name: "Pro" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("selecting an item updates its aria-checked and data-state", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <RadioCard.Root aria-label="Plan">
        <RadioCard.Item value="starter">Starter</RadioCard.Item>
        <RadioCard.Item value="pro">Pro</RadioCard.Item>
      </RadioCard.Root>,
    );
    const pro = screen.getByRole("radio", { name: "Pro" });

    // Act
    await user.click(pro);

    // Assert
    expect(pro).toHaveAttribute("aria-checked", "true");
    expect(pro).toHaveAttribute("data-state", "checked");
    expect(screen.getByRole("radio", { name: "Starter" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("fires onValueChange with the selected value when an item is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <RadioCard.Root aria-label="Plan" onValueChange={onValueChange}>
        <RadioCard.Item value="pro">Pro</RadioCard.Item>
      </RadioCard.Root>,
    );

    // Act
    await user.click(screen.getByRole("radio", { name: "Pro" }));

    // Assert
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith("pro");
  });

  it("clicking the already-selected item does not fire onValueChange again", async () => {
    // Arrange
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <RadioCard.Root
        aria-label="Plan"
        defaultValue="pro"
        onValueChange={onValueChange}
      >
        <RadioCard.Item value="pro">Pro</RadioCard.Item>
      </RadioCard.Root>,
    );

    // Act
    await user.click(screen.getByRole("radio", { name: "Pro" }));

    // Assert
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("does not re-fire onValueChange when a freshly selected item is re-clicked", async () => {
    // Arrange — no defaultValue, so the guard reads a value that changes after
    // the first click; a stale select closure would re-fire on the second.
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <RadioCard.Root aria-label="Plan" onValueChange={onValueChange}>
        <RadioCard.Item value="pro">Pro</RadioCard.Item>
        <RadioCard.Item value="starter">Starter</RadioCard.Item>
      </RadioCard.Root>,
    );
    const pro = screen.getByRole("radio", { name: "Pro" });

    // Act — select Pro, then click it again while it is already selected.
    await user.click(pro);
    await user.click(pro);

    // Assert — exactly one change: the redundant second click is a no-op.
    expect(onValueChange).toHaveBeenCalledOnce();
  });
});
