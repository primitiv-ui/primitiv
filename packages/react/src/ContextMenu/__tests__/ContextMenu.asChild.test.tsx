import { fireEvent, render, screen } from "@testing-library/react";

import { ContextMenu } from "../ContextMenu";

describe("ContextMenu asChild", () => {
  it("delegates Trigger to the child element via asChild", () => {
    // Arrange & Act
    render(
      <ContextMenu.Root>
        <ContextMenu.Trigger asChild>
          <div data-testid="custom-trigger">Area</div>
        </ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item>Rename</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Assert
    const trigger = screen.getByTestId("custom-trigger");
    expect(trigger.tagName).toBe("DIV");
  });

  it("delegates Content to the child element via asChild", () => {
    // Arrange & Act
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content asChild>
          <div data-testid="custom-content">
            <ContextMenu.Item>Rename</ContextMenu.Item>
          </div>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Assert
    const content = screen.getByTestId("custom-content");
    expect(content.tagName).toBe("DIV");
    expect(content).toHaveAttribute("role", "menu");
    expect(content).toHaveAttribute("popover", "manual");
  });

  it("delegates Item to the child element and auto-closes on click", () => {
    // Arrange
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ContextMenu.Root defaultOpen onOpenChange={onOpenChange}>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item asChild onSelect={onSelect}>
            <a href="#rename" data-testid="custom-item">
              Rename
            </a>
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const item = screen.getByTestId("custom-item");
    expect(item.tagName).toBe("A");
    expect(item).toHaveAttribute("role", "menuitem");

    // Act
    fireEvent.click(item);

    // Assert
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("delegates Separator to the child element via asChild", () => {
    // Arrange & Act
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item>Rename</ContextMenu.Item>
          <ContextMenu.Separator asChild>
            <hr data-testid="custom-separator" />
          </ContextMenu.Separator>
          <ContextMenu.Item>Delete</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Assert
    const separator = screen.getByTestId("custom-separator");
    expect(separator.tagName).toBe("HR");
    expect(separator).toHaveAttribute("role", "separator");
  });

  it("delegates Group and Label to the child elements via asChild", () => {
    // Arrange & Act
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Group asChild>
            <section data-testid="custom-group">
              <ContextMenu.Label asChild>
                <h2 data-testid="custom-label">Actions</h2>
              </ContextMenu.Label>
              <ContextMenu.Item>Rename</ContextMenu.Item>
            </section>
          </ContextMenu.Group>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Assert
    expect(screen.getByTestId("custom-group").tagName).toBe("SECTION");
    expect(screen.getByTestId("custom-label").tagName).toBe("H2");
  });

  it("delegates CheckboxItem and ItemIndicator to the child elements via asChild", () => {
    // Arrange & Act
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.CheckboxItem asChild defaultChecked>
            <a href="#grid" data-testid="custom-check">
              <ContextMenu.ItemIndicator asChild>
                <svg data-testid="custom-indicator" />
              </ContextMenu.ItemIndicator>
              Show grid
            </a>
          </ContextMenu.CheckboxItem>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Assert
    const check = screen.getByTestId("custom-check");
    expect(check.tagName).toBe("A");
    expect(check).toHaveAttribute("role", "menuitemcheckbox");
    const indicator = screen.getByTestId("custom-indicator");
    expect(indicator.tagName).toBe("svg");
    expect(indicator).toHaveAttribute("data-state", "checked");
  });

  it("delegates RadioGroup, RadioItem, Sub, SubTrigger, and SubContent via asChild", () => {
    // Arrange & Act
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.RadioGroup asChild defaultValue="a">
            <section data-testid="custom-rg">
              <ContextMenu.RadioItem asChild value="a">
                <a href="#a" data-testid="custom-ri">
                  Alpha
                </a>
              </ContextMenu.RadioItem>
            </section>
          </ContextMenu.RadioGroup>
          <ContextMenu.Sub defaultOpen>
            <ContextMenu.SubTrigger asChild>
              <a href="#more" data-testid="custom-st">
                More
              </a>
            </ContextMenu.SubTrigger>
            <ContextMenu.SubContent asChild>
              <div data-testid="custom-sc">
                <ContextMenu.Item>Nested</ContextMenu.Item>
              </div>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Assert
    expect(screen.getByTestId("custom-rg").tagName).toBe("SECTION");
    expect(screen.getByTestId("custom-ri")).toHaveAttribute(
      "role",
      "menuitemradio",
    );
    expect(screen.getByTestId("custom-st")).toHaveAttribute(
      "aria-haspopup",
      "menu",
    );
    expect(screen.getByTestId("custom-sc")).toHaveAttribute("role", "menu");
  });
});
