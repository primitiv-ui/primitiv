import { render, screen } from "@testing-library/react";

import { Collapsible } from "../Collapsible";

describe("Collapsible basic rendering tests", () => {
  it("should render Collapsible.Root as a div with data-state='closed' by default", () => {
    // Arrange
    render(<Collapsible.Root data-testid="test-collapsible" />);
    const root = screen.getByTestId("test-collapsible");

    // Assert
    expect(root.tagName).toBe("DIV");
    expect(root).toHaveAttribute("data-state", "closed");
  });

  it("should render Collapsible.Trigger as a button with type='button'", () => {
    // Arrange
    render(
      <Collapsible.Root>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content>Content</Collapsible.Content>
      </Collapsible.Root>,
    );
    const trigger = screen.getByRole("button", { name: "Toggle" });

    // Assert
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger).toHaveAttribute("type", "button");
  });

  it("should give Collapsible.Trigger aria-expanded='false' by default", () => {
    // Arrange
    render(
      <Collapsible.Root>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content>Content</Collapsible.Content>
      </Collapsible.Root>,
    );
    const trigger = screen.getByRole("button", { name: "Toggle" });

    // Assert
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("should wire aria-controls on Trigger to the id of Content", () => {
    // Arrange
    render(
      <Collapsible.Root>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content data-testid="content">Content</Collapsible.Content>
      </Collapsible.Root>,
    );
    const trigger = screen.getByRole("button", { name: "Toggle" });
    const content = screen.getByTestId("content");

    // Assert
    expect(trigger).toHaveAttribute("aria-controls", content.id);
    expect(content.id).not.toBe("");
  });

  it("gives the Trigger a '-trigger' suffixed id distinct from the Content id", () => {
    // Arrange
    render(
      <Collapsible.Root>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content data-testid="content">Content</Collapsible.Content>
      </Collapsible.Root>,
    );
    const trigger = screen.getByRole("button", { name: "Toggle" });
    const content = screen.getByTestId("content");

    // Assert — a derived, non-empty id that cannot collide with the content's.
    expect(trigger.id).toMatch(/-trigger$/);
    expect(trigger.id).not.toBe(content.id);
  });

  it("sets a displayName on the compound and each sub-component", () => {
    // Assert — empty displayNames would render each as anonymous in DevTools.
    // `Collapsible`, `Collapsible.Root`, and the underlying function are one
    // object (Object.assign compound), so the compound's "Collapsible" alias is
    // the observable Root displayName; the sub-components are distinct objects.
    expect(Collapsible.displayName).toBe("Collapsible");
    expect(Collapsible.Trigger.displayName).toBe("CollapsibleTrigger");
    expect(Collapsible.Content.displayName).toBe("CollapsibleContent");
    expect(Collapsible.TriggerIcon.displayName).toBe("CollapsibleTriggerIcon");
  });

  it("should hide Content when closed", () => {
    // Arrange
    render(
      <Collapsible.Root>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content data-testid="content">Content</Collapsible.Content>
      </Collapsible.Root>,
    );
    const content = screen.getByTestId("content");

    // Assert
    expect(content).not.toBeVisible();
  });

  it("should set data-state='closed' on Trigger when closed", () => {
    // Arrange
    render(
      <Collapsible.Root>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content>Content</Collapsible.Content>
      </Collapsible.Root>,
    );
    const trigger = screen.getByRole("button", { name: "Toggle" });

    // Assert
    expect(trigger).toHaveAttribute("data-state", "closed");
  });

  it("should set data-state='closed' on Content when closed", () => {
    // Arrange
    render(
      <Collapsible.Root>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content data-testid="content">Content</Collapsible.Content>
      </Collapsible.Root>,
    );
    const content = screen.getByTestId("content");

    // Assert
    expect(content).toHaveAttribute("data-state", "closed");
  });

  it("should forward arbitrary HTML attributes to the rendered Root div", () => {
    // Arrange
    render(
      <Collapsible.Root
        data-testid="test-collapsible"
        className="custom"
        aria-label="custom label"
      />,
    );
    const root = screen.getByTestId("test-collapsible");

    // Assert
    expect(root).toHaveClass("custom");
    expect(root).toHaveAttribute("aria-label", "custom label");
  });
});
