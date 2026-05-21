import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { ContextMenu } from "../ContextMenu";

describe("ContextMenu state modes", () => {
  it("honours controlled open prop and defers to onOpenChange callback", () => {
    // Arrange
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            data-testid="external"
          >
            Open
          </button>
          <ContextMenu.Root open={open} onOpenChange={setOpen}>
            <ContextMenu.Trigger>Area</ContextMenu.Trigger>
            <ContextMenu.Content>
              <ContextMenu.Item>Rename</ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu.Root>
        </>
      );
    }
    render(<Controlled />);
    const menu = screen.getByRole("menu", { hidden: true });
    expect(menu).toHaveAttribute("data-state", "closed");

    // Act — flip external state, no user gesture on the trigger
    fireEvent.click(screen.getByTestId("external"));

    // Assert — menu opened solely because the parent passed open=true
    expect(menu).toHaveAttribute("data-state", "open");
  });

  it("does not call onOpenChange when the consumer flips controlled open externally", () => {
    // Arrange
    const onOpenChange = vi.fn();
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              onOpenChange.mockClear();
            }}
            data-testid="external"
          >
            Open
          </button>
          <ContextMenu.Root open={open} onOpenChange={onOpenChange}>
            <ContextMenu.Trigger>Area</ContextMenu.Trigger>
            <ContextMenu.Content>
              <ContextMenu.Item>Rename</ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu.Root>
        </>
      );
    }
    render(<Controlled />);

    // Act
    fireEvent.click(screen.getByTestId("external"));

    // Assert — onOpenChange must only fire for user-driven transitions
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("honours controlled open prop on ContextMenu.Sub", () => {
    // Arrange — the external button lives outside any open menu, so we keep
    // Root closed during the flip; otherwise Content's outside-click handler
    // would fire on the same gesture and cascade-close the sub. The
    // assertion is on Sub.open's reflection in aria-expanded, which is
    // independent of Root's open state.
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            data-testid="external"
          >
            Open sub
          </button>
          <ContextMenu.Root>
            <ContextMenu.Trigger>Area</ContextMenu.Trigger>
            <ContextMenu.Content>
              <ContextMenu.Sub open={open} onOpenChange={setOpen}>
                <ContextMenu.SubTrigger>More</ContextMenu.SubTrigger>
                <ContextMenu.SubContent>
                  <ContextMenu.Item>Nested</ContextMenu.Item>
                </ContextMenu.SubContent>
              </ContextMenu.Sub>
            </ContextMenu.Content>
          </ContextMenu.Root>
        </>
      );
    }
    render(<Controlled />);
    const subTrigger = screen.getByRole("menuitem", {
      name: "More",
      hidden: true,
    });
    expect(subTrigger).toHaveAttribute("aria-expanded", "false");

    // Act
    fireEvent.click(screen.getByTestId("external"));

    // Assert
    expect(subTrigger).toHaveAttribute("aria-expanded", "true");
  });
});
