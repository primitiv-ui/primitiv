import userEvent from "@testing-library/user-event";

import { SplitButtonController } from "../SplitButtonController";

/** A connected controller over one action `<button>`, counting every open it asks for. */
function connected(options: { disabled?: boolean } = {}) {
  const opens: true[] = [];
  const root = document.createElement("div");
  const action = document.createElement("button");
  action.type = "button";
  action.textContent = "Squash and merge";
  const other = document.createElement("button");
  other.type = "button";
  other.textContent = "More";
  root.append(action, other);
  document.body.append(root);
  const controller = new SplitButtonController(root, { open: () => opens.push(true) });
  controller.registerTrigger("action", action, options);
  controller.connect();
  return { action, other, opens };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("SplitButtonController", () => {
  it("asks the host to open the menu on ArrowDown from the action, and keeps the key from scrolling", async () => {
    // Arrange
    const { action, opens } = connected();
    const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });

    // Act
    action.dispatchEvent(event);

    // Assert
    expect(opens).toHaveLength(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it("leaves every other key to the action", async () => {
    // Arrange
    const user = userEvent.setup();
    const { action, opens } = connected();
    action.focus();
    const event = new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true });

    // Act
    await user.keyboard("{ArrowUp}{Enter}");
    action.dispatchEvent(event);

    // Assert
    expect(opens).toEqual([]);
    expect(event.defaultPrevented).toBe(false);
  });

  it("asks nothing for ArrowDown elsewhere in the group", async () => {
    // Arrange
    const user = userEvent.setup();
    const { other, opens } = connected();
    other.focus();

    // Act
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(opens).toEqual([]);
  });

  it("asks nothing for a disabled action, and leaves its keys alone", () => {
    // Arrange
    const { action, opens } = connected({ disabled: true });
    const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });

    // Act
    action.dispatchEvent(event);

    // Assert
    expect(opens).toEqual([]);
    expect(event.defaultPrevented).toBe(false);
  });

  it("does nothing on a click: the action's click is the consumer's", async () => {
    // Arrange
    const user = userEvent.setup();
    const { action, opens } = connected();

    // Act
    await user.click(action);

    // Assert
    expect(opens).toEqual([]);
  });
});
