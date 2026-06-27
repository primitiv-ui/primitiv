import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ContextMenu } from "../ContextMenu";

function renderMenu() {
  return render(
    <ContextMenu.Root defaultOpen>
      <ContextMenu.Trigger>Area</ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item>Apple</ContextMenu.Item>
        <ContextMenu.Item>Banana</ContextMenu.Item>
        <ContextMenu.Item>Blueberry</ContextMenu.Item>
        <ContextMenu.Item>Cherry</ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>,
  );
}

describe("ContextMenu typeahead", () => {
  it("focuses the next item that starts with the typed character", async () => {
    // Arrange
    const user = userEvent.setup();
    renderMenu();

    // Act
    await user.keyboard("b");

    // Assert
    expect(
      screen.getByRole("menuitem", { name: "Banana", hidden: true }),
    ).toHaveFocus();
  });

  it("cycles through items sharing a first letter when the same character is pressed repeatedly", async () => {
    // Arrange
    const user = userEvent.setup();
    renderMenu();

    // Act
    await user.keyboard("b");
    expect(
      screen.getByRole("menuitem", { name: "Banana", hidden: true }),
    ).toHaveFocus();
    await user.keyboard("b");

    // Assert
    expect(
      screen.getByRole("menuitem", { name: "Blueberry", hidden: true }),
    ).toHaveFocus();
  });

  it("matches a multi-character prefix typed within the typeahead window", async () => {
    // Arrange
    const user = userEvent.setup();
    renderMenu();

    // Act — "bl" should jump straight to Blueberry, skipping Banana
    await user.keyboard("bl");

    // Assert
    expect(
      screen.getByRole("menuitem", { name: "Blueberry", hidden: true }),
    ).toHaveFocus();
  });

  it("ignores disabled items in the typeahead match", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item>Apple</ContextMenu.Item>
          <ContextMenu.Item disabled>Banana</ContextMenu.Item>
          <ContextMenu.Item>Blueberry</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Act
    await user.keyboard("b");

    // Assert — Banana is disabled, so first match is Blueberry
    expect(
      screen.getByRole("menuitem", { name: "Blueberry", hidden: true }),
    ).toHaveFocus();
  });

  it("resets the typed query after the typeahead window elapses", () => {
    // Arrange — fake timers so the reset timeout can be flushed deterministically.
    vi.useFakeTimers();
    try {
      renderMenu();
      const menu = screen.getByRole("menu", { hidden: true });

      // First keystroke matches Banana and arms the reset timer.
      fireEvent.keyDown(menu, { key: "b" });
      expect(
        screen.getByRole("menuitem", { name: "Banana", hidden: true }),
      ).toHaveFocus();

      // Let the window lapse so the query clears.
      vi.advanceTimersByTime(5000);

      // Act — a fresh "a" must be treated as a new search, not appended to "b"
      // (which would match nothing and leave focus on Banana).
      fireEvent.keyDown(menu, { key: "a" });

      // Assert
      expect(
        screen.getByRole("menuitem", { name: "Apple", hidden: true }),
      ).toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });

  it("starts the search from the top when no item is focused", () => {
    // Arrange — blur the auto-focused item so currentIndex resolves to -1 and
    // the search starts at index 0.
    renderMenu();
    const menu = screen.getByRole("menu", { hidden: true });
    (document.activeElement as HTMLElement | null)?.blur();

    // Act
    fireEvent.keyDown(menu, { key: "a" });

    // Assert
    expect(
      screen.getByRole("menuitem", { name: "Apple", hidden: true }),
    ).toHaveFocus();
  });
});
