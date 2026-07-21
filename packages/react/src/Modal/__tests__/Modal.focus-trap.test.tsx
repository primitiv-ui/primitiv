import "./dialog-polyfill";

import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Modal } from "../Modal";

function getDialog() {
  return document.querySelector("dialog") as HTMLDialogElement;
}

// WAI-ARIA APG Modal Dialog pattern: Tab must cycle *within* the dialog and
// never reach the browser chrome. A native <dialog> inerts the background but
// does not wrap focus, so Modal.Content adds a boundary Tab-wrap trap. These
// tests render a Trigger (outside the dialog) in the wrap cases so that,
// without the trap, a native wrap would land on the Trigger — proving the
// assertion is driven by the trap, not by jsdom's own tab order.
describe("Modal focus trap — Tab cycles within the dialog", () => {
  it("wraps focus from the last element back to the first on Tab", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Modal.Root defaultOpen>
        <Modal.Trigger>Open</Modal.Trigger>
        <Modal.Content>
          <button type="button">First</button>
          <button type="button">Second</button>
          <button type="button">Third</button>
        </Modal.Content>
      </Modal.Root>,
    );
    screen.getByRole("button", { name: "Third" }).focus();

    // Act
    await user.tab();

    // Assert
    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
  });

  it("leaves an interior forward Tab to native handling (no wrap)", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Modal.Root defaultOpen>
        <Modal.Content>
          <button type="button">First</button>
          <button type="button">Second</button>
          <button type="button">Third</button>
        </Modal.Content>
      </Modal.Root>,
    );
    screen.getByRole("button", { name: "First" }).focus();

    // Act
    await user.tab();

    // Assert
    expect(screen.getByRole("button", { name: "Second" })).toHaveFocus();
  });

  it("wraps focus from the first element to the last on Shift+Tab", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Modal.Root defaultOpen>
        <Modal.Trigger>Open</Modal.Trigger>
        <Modal.Content>
          <button type="button">First</button>
          <button type="button">Second</button>
          <button type="button">Third</button>
        </Modal.Content>
      </Modal.Root>,
    );
    screen.getByRole("button", { name: "First" }).focus();

    // Act
    await user.tab({ shift: true });

    // Assert
    expect(screen.getByRole("button", { name: "Third" })).toHaveFocus();
  });

  it("leaves an interior Shift+Tab to native handling (no wrap)", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Modal.Root defaultOpen>
        <Modal.Content>
          <button type="button">First</button>
          <button type="button">Second</button>
          <button type="button">Third</button>
        </Modal.Content>
      </Modal.Root>,
    );
    screen.getByRole("button", { name: "Second" }).focus();

    // Act
    await user.tab({ shift: true });

    // Assert
    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
  });

  it("ignores non-Tab keys (typing is never intercepted)", () => {
    // Arrange
    render(
      <Modal.Root defaultOpen>
        <Modal.Content>
          <button type="button">First</button>
          <button type="button">Second</button>
        </Modal.Content>
      </Modal.Root>,
    );
    const first = screen.getByRole("button", { name: "First" });
    first.focus();

    // Act
    const event = createEvent.keyDown(first, { key: "a" });
    fireEvent(first, event);

    // Assert
    expect(first).toHaveFocus();
    expect(event.defaultPrevented).toBe(false);
  });

  it("blocks Tab when the dialog has no focusable content", () => {
    // Arrange
    render(
      <Modal.Root defaultOpen>
        <Modal.Content>Just text, nothing to focus.</Modal.Content>
      </Modal.Root>,
    );
    const dialog = getDialog();

    // Act
    const event = createEvent.keyDown(dialog, { key: "Tab" });
    fireEvent(dialog, event);

    // Assert — Tab is swallowed so focus cannot escape to the browser chrome.
    expect(event.defaultPrevented).toBe(true);
  });

  it("stays inactive while the dialog is closed", () => {
    // Arrange — Content always renders its <dialog>; without defaultOpen it is
    // mounted but closed, so the trap must not fire.
    render(
      <Modal.Root>
        <Modal.Content>Just text, nothing to focus.</Modal.Content>
      </Modal.Root>,
    );
    const dialog = getDialog();
    expect(dialog.open).toBe(false);

    // Act
    const event = createEvent.keyDown(dialog, { key: "Tab" });
    fireEvent(dialog, event);

    // Assert — the guard returns before the empty-content block would preventDefault.
    expect(event.defaultPrevented).toBe(false);
  });
});
