import userEvent from "@testing-library/user-event";

import { CheckboxCardController } from "../CheckboxCardController";

/** A connected controller over one card `<button>`, recording every change it asks for. */
function connected(checked: boolean | "indeterminate", options: { disabled?: boolean } = {}) {
  const changes: boolean[] = [];
  const root = document.createElement("div");
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Card";
  root.append(button);
  document.body.append(root);
  const controller = new CheckboxCardController(root, { state: () => ({ checked }), change: (next) => changes.push(next) });
  controller.registerTrigger("card", button, options);
  controller.connect();
  return { button, changes };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("CheckboxCardController", () => {
  it.each([
    [false, true],
    [true, false],
    ["indeterminate", true],
  ] as const)("asks the host to turn a %j card %j on a click", async (checked, next) => {
    // Arrange
    const user = userEvent.setup();
    const { button, changes } = connected(checked);

    // Act
    await user.click(button);

    // Assert
    expect(changes).toEqual([next]);
  });

  it("toggles once for Space and once for Enter, through the button's own click", async () => {
    // Arrange
    const user = userEvent.setup();
    const { button, changes } = connected(false);
    button.focus();

    // Act
    await user.keyboard(" {Enter}");

    // Assert
    expect(changes).toEqual([true, true]);
  });

  it("asks nothing for a disabled card, and leaves its keys alone", async () => {
    // Arrange
    const user = userEvent.setup();
    const { button, changes } = connected(false, { disabled: true });
    const event = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });

    // Act
    await user.click(button);
    button.dispatchEvent(event);

    // Assert
    expect(changes).toEqual([]);
    expect(event.defaultPrevented).toBe(false);
  });
});
