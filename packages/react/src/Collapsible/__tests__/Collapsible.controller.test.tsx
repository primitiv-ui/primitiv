import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode, createRef } from "react";

import { Collapsible } from "../Collapsible";

// Collapsible's DOM behaviour runs in the shared CollapsibleController from
// @primitiv-ui/web (RFC 0033 §3.4). These cover what hosting it adds: one
// controller per root under StrictMode, the root's ref still reaching the
// consumer, a nested collapsible kept to its own trigger, and a consumer
// onKeyDown running beside the keyboard contract.

describe("Collapsible on the shared controller", () => {
  it("toggles once per click under StrictMode, whose effects run twice", async () => {
    // Arrange
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <StrictMode>
        <Collapsible.Root open={false} onOpenChange={onOpenChange}>
          <Collapsible.Trigger>Toggle</Collapsible.Trigger>
          <Collapsible.Content>Panel</Collapsible.Content>
        </Collapsible.Root>
      </StrictMode>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Toggle" }));

    // Assert
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("passes the root's ref through to the consumer and keeps toggling", async () => {
    // Arrange
    const user = userEvent.setup();
    const ref = createRef<HTMLDivElement>();
    render(
      <Collapsible.Root ref={ref}>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content>Panel</Collapsible.Content>
      </Collapsible.Root>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Toggle" }));

    // Assert
    expect(ref.current?.getAttribute("data-state")).toBe("open");
  });

  it("toggles only the nested collapsible whose trigger is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const outer = vi.fn();
    render(
      <Collapsible.Root defaultOpen onOpenChange={outer}>
        <Collapsible.Trigger>Outer</Collapsible.Trigger>
        <Collapsible.Content>
          <Collapsible.Root>
            <Collapsible.Trigger>Inner</Collapsible.Trigger>
            <Collapsible.Content>Inner panel</Collapsible.Content>
          </Collapsible.Root>
        </Collapsible.Content>
      </Collapsible.Root>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Inner" }));

    // Assert
    expect(outer).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Inner" }).getAttribute("aria-expanded")).toBe("true");
  });

  it("follows the root becoming disabled after mount", async () => {
    // Arrange
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Collapsible.Root onOpenChange={onOpenChange}>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content>Panel</Collapsible.Content>
      </Collapsible.Root>,
    );
    rerender(
      <Collapsible.Root disabled onOpenChange={onOpenChange}>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content>Panel</Collapsible.Content>
      </Collapsible.Root>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Toggle" }));

    // Assert
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("runs a consumer onKeyDown beside the keyboard contract", async () => {
    // Arrange
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(
      <Collapsible.Root>
        <Collapsible.Trigger onKeyDown={onKeyDown}>Toggle</Collapsible.Trigger>
        <Collapsible.Content>Panel</Collapsible.Content>
      </Collapsible.Root>,
    );
    screen.getByRole("button", { name: "Toggle" }).focus();

    // Act
    await user.keyboard("{Enter}");

    // Assert
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Toggle" }).getAttribute("aria-expanded")).toBe("true");
  });
});
