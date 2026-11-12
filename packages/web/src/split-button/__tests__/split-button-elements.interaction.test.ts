import userEvent from "@testing-library/user-event";

import { splitButtonHtml } from "./split-button.fixtures";
import { action, dropdown, firstItem, mount, root, settle, trigger } from "./mount";

afterEach(() => {
  document.body.replaceChildren();
});

describe("<primitiv-split-button> interaction", () => {
  it("opens the menu from the action with ArrowDown and focuses its first item", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(splitButtonHtml());
    action().focus();

    // Act
    await user.keyboard("{ArrowDown}");
    await settle();

    // Assert
    expect(dropdown().open).toBe(true);
    expect(root().getAttribute("data-state")).toBe("open");
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(firstItem());
  });

  it("opens through the dropdown's change event, so a listener can veto it", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(splitButtonHtml());
    const changes: unknown[] = [];
    root().addEventListener("primitiv-dropdown-change", (event) => {
      changes.push((event as CustomEvent).detail);
      event.preventDefault();
    });
    action().focus();

    // Act
    await user.keyboard("{ArrowDown}");
    await settle();

    // Assert
    expect(changes).toEqual([{ open: true }]);
    expect(dropdown().open).toBe(false);
    expect(root().getAttribute("data-state")).toBe("closed");
  });

  it("leaves other keys and clicks on the action to the action", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(splitButtonHtml());
    let clicks = 0;
    action().addEventListener("click", () => clicks++);

    // Act
    await user.click(action());
    await user.keyboard("{ArrowUp}{Enter}");
    await settle();

    // Assert
    expect(clicks).toBe(2);
    expect(dropdown().open).toBe(false);
  });

  it("follows the menu as the trigger opens it and Escape closes it", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(splitButtonHtml());

    // Act
    await user.click(trigger());
    await settle();
    const opened = root().getAttribute("data-state");
    await user.keyboard("{Escape}");
    await settle();

    // Assert
    expect(opened).toBe("open");
    expect(root().getAttribute("data-state")).toBe("closed");
    expect(document.activeElement).toBe(trigger());
  });

  it("does not open from an action the consumer disabled", async () => {
    // Arrange
    await mount(splitButtonHtml({ actionDisabled: true }));
    const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });

    // Act
    action().dispatchEvent(event);
    await settle();

    // Assert
    expect(event.defaultPrevented).toBe(false);
    expect(dropdown().open).toBe(false);
  });

  it("does not open from the action while the group is disabled", async () => {
    // Arrange
    await mount(splitButtonHtml({ disabled: true }));
    const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });

    // Act
    action().dispatchEvent(event);
    await settle();

    // Assert
    expect(event.defaultPrevented).toBe(false);
    expect(dropdown().open).toBe(false);
  });
});
