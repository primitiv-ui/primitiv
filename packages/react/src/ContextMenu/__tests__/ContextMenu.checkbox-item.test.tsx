import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { ContextMenu } from "../ContextMenu";

describe("ContextMenu.CheckboxItem", () => {
  it("renders as role=menuitemcheckbox with aria-checked reflecting its state", () => {
    // Arrange & Act
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.CheckboxItem defaultChecked>
            Show grid
          </ContextMenu.CheckboxItem>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Assert
    const item = screen.getByRole("menuitemcheckbox", {
      name: "Show grid",
      hidden: true,
    });
    expect(item).toHaveAttribute("aria-checked", "true");
  });

  it("toggles the checked state on click and fires onCheckedChange (uncontrolled)", () => {
    // Arrange
    const onCheckedChange = vi.fn();
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.CheckboxItem onCheckedChange={onCheckedChange}>
            Show grid
          </ContextMenu.CheckboxItem>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const item = screen.getByRole("menuitemcheckbox", {
      name: "Show grid",
      hidden: true,
    });
    expect(item).toHaveAttribute("aria-checked", "false");

    // Act
    fireEvent.click(item);

    // Assert
    expect(onCheckedChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("stays open when onSelect calls preventDefault", () => {
    // Arrange
    const onSelect = vi.fn((event: Event) => event.preventDefault());
    const onOpenChange = vi.fn();
    render(
      <ContextMenu.Root defaultOpen onOpenChange={onOpenChange}>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.CheckboxItem onSelect={onSelect}>
            Show grid
          </ContextMenu.CheckboxItem>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const item = screen.getByRole("menuitemcheckbox", {
      name: "Show grid",
      hidden: true,
    });

    // Act
    fireEvent.click(item);

    // Assert
    expect(onSelect).toHaveBeenCalledOnce();
    expect(item).toHaveAttribute("aria-checked", "true");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("resolves indeterminate to checked on the next activation", () => {
    // Arrange
    function Controlled() {
      const [checked, setChecked] = useState<boolean | "indeterminate">(
        "indeterminate",
      );
      return (
        <ContextMenu.Root defaultOpen>
          <ContextMenu.Trigger>Area</ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.CheckboxItem
              checked={checked}
              onCheckedChange={setChecked}
            >
              Show grid
            </ContextMenu.CheckboxItem>
          </ContextMenu.Content>
        </ContextMenu.Root>
      );
    }

    render(<Controlled />);
    const item = screen.getByRole("menuitemcheckbox", {
      name: "Show grid",
      hidden: true,
    });
    expect(item).toHaveAttribute("aria-checked", "mixed");

    // Act
    fireEvent.click(item);

    // Assert
    expect(item).toHaveAttribute("aria-checked", "true");
  });

  it("no-ops when disabled", () => {
    // Arrange
    const onCheckedChange = vi.fn();
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.CheckboxItem
            disabled
            onCheckedChange={onCheckedChange}
          >
            Show grid
          </ContextMenu.CheckboxItem>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const item = screen.getByRole("menuitemcheckbox", {
      name: "Show grid",
      hidden: true,
    });

    // Act
    fireEvent.click(item);

    // Assert
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(item).toHaveAttribute("aria-disabled", "true");
  });
});
