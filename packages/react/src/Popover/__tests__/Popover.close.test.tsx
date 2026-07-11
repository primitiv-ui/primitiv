import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Popover } from "../Popover";

describe("Popover.Close", () => {
  it("renders a button that closes the popover when clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Popover.Root defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content data-testid="content">
          <Popover.Close>Dismiss</Popover.Close>
        </Popover.Content>
      </Popover.Root>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    const content = screen.getByTestId("content");

    // Act
    await user.click(screen.getByRole("button", { name: "Dismiss", hidden: true }));

    // Assert
    expect(content).toHaveAttribute("data-state", "closed");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("returns focus to the trigger after closing", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Popover.Root defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <Popover.Close>Dismiss</Popover.Close>
        </Popover.Content>
      </Popover.Root>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });

    // Act
    await user.click(screen.getByRole("button", { name: "Dismiss", hidden: true }));

    // Assert
    expect(trigger).toHaveFocus();
  });

  it("lets a consumer onClick veto the close via preventDefault", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Popover.Root defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content data-testid="content">
          <Popover.Close onClick={(event) => event.preventDefault()}>
            Dismiss
          </Popover.Close>
        </Popover.Content>
      </Popover.Root>,
    );
    const content = screen.getByTestId("content");

    // Act
    await user.click(screen.getByRole("button", { name: "Dismiss", hidden: true }));

    // Assert
    expect(content).toHaveAttribute("data-state", "open");
  });
});
