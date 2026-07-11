import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Popover } from "../Popover";

describe("Popover light-dismiss", () => {
  it("closes when the user clicks outside the open popover", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <div>
        <Popover.Root defaultOpen>
          <Popover.Trigger>Open</Popover.Trigger>
          <Popover.Content data-testid="content">Content</Popover.Content>
        </Popover.Root>
        <button type="button">Outside</button>
      </div>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    const content = screen.getByTestId("content");

    // Act
    await user.click(screen.getByRole("button", { name: "Outside" }));

    // Assert
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(content).toHaveAttribute("data-state", "closed");
  });

  it("stays open when the user clicks inside the content", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Popover.Root defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content data-testid="content">
          <span>Inside</span>
        </Popover.Content>
      </Popover.Root>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    const content = screen.getByTestId("content");

    // Act
    await user.click(screen.getByText("Inside"));

    // Assert
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(content).toHaveAttribute("data-state", "open");
  });

  it("syncs React state to closed when the browser light-dismisses (native toggle event)", () => {
    // Arrange
    render(
      <Popover.Root defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content data-testid="content">Content</Popover.Content>
      </Popover.Root>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    const content = screen.getByTestId("content");

    // Act — simulate the browser closing the popover on its own
    const toggleEvent = new Event("toggle");
    Object.defineProperty(toggleEvent, "newState", { value: "closed" });
    act(() => {
      content.dispatchEvent(toggleEvent);
    });

    // Assert
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(content).toHaveAttribute("data-state", "closed");
  });

  it("ignores a native toggle event that reports the popover is opening", () => {
    // Arrange
    render(
      <Popover.Root defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content data-testid="content">Content</Popover.Content>
      </Popover.Root>,
    );
    const content = screen.getByTestId("content");

    // Act
    const toggleEvent = new Event("toggle");
    Object.defineProperty(toggleEvent, "newState", { value: "open" });
    content.dispatchEvent(toggleEvent);

    // Assert
    expect(content).toHaveAttribute("data-state", "open");
  });

  it("closes only once when the trigger itself is clicked to close (no double dismiss)", async () => {
    // Arrange
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Popover.Root onOpenChange={onOpenChange}>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover.Root>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });

    // Act
    await user.click(trigger); // open
    await user.click(trigger); // close via the trigger, not light-dismiss

    // Assert
    expect(onOpenChange).toHaveBeenNthCalledWith(1, true);
    expect(onOpenChange).toHaveBeenNthCalledWith(2, false);
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });
});
