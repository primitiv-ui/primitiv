import { render, screen } from "@testing-library/react";

import { Popover } from "../Popover";

describe("Popover basic rendering tests", () => {
  it("should render Popover.Trigger as a button with type='button'", () => {
    // Arrange
    render(
      <Popover.Root>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover.Root>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });

    // Assert
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger).toHaveAttribute("type", "button");
  });

  it("should give Popover.Trigger aria-haspopup='dialog'", () => {
    // Arrange
    render(
      <Popover.Root>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover.Root>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });

    // Assert
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("should give Popover.Trigger aria-expanded='false' by default", () => {
    // Arrange
    render(
      <Popover.Root>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover.Root>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });

    // Assert
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("should wire aria-controls on Trigger to the id of Content", () => {
    // Arrange
    render(
      <Popover.Root>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content data-testid="content">Content</Popover.Content>
      </Popover.Root>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    const content = screen.getByTestId("content");

    // Assert
    expect(trigger).toHaveAttribute("aria-controls", content.id);
    expect(content.id).not.toBe("");
  });

  it("should render no DOM element for Popover.Root itself", () => {
    // Arrange
    const { container } = render(
      <Popover.Root>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover.Root>,
    );

    // Assert — the trigger button is the first rendered node, not a Root wrapper
    expect(container.firstElementChild?.tagName).toBe("BUTTON");
  });
});
