import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Popover } from "../Popover";

describe("Popover focus management", () => {
  it("moves focus to the first focusable element inside the content on open", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Popover.Root>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <button type="button">First</button>
          <button type="button">Second</button>
        </Popover.Content>
      </Popover.Root>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Open" }));

    // Assert
    expect(screen.getByRole("button", { name: "First", hidden: true })).toHaveFocus();
  });

  it("moves focus to the content element itself when it has no focusable children", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Popover.Root>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content data-testid="content">Just text, nothing to focus.</Popover.Content>
      </Popover.Root>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Open" }));

    // Assert
    expect(screen.getByTestId("content")).toHaveFocus();
  });
});
