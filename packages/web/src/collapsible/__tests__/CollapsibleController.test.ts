import userEvent from "@testing-library/user-event";

import { CollapsibleController, type CollapsibleControllerHost } from "../CollapsibleController";

/** A host that starts `open` and records every change it is asked for. */
function hostWith(open = false) {
  const host: CollapsibleControllerHost & { changes: boolean[] } = {
    changes: [],
    state: () => ({ open }),
    change(next) {
      host.changes.push(next);
    },
  };
  return host;
}

/** A connected controller over a root holding one trigger `<button>`. */
function connected(host: CollapsibleControllerHost, options: { disabled?: boolean } = {}) {
  const root = document.createElement("div");
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Toggle";
  root.append(button);
  document.body.append(root);
  const controller = new CollapsibleController(root, host);
  controller.registerTrigger("trigger", button, options);
  controller.connect();
  return { root, button, controller };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("CollapsibleController", () => {
  describe("clicks", () => {
    it("asks the host to open a closed collapsible", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith(false);
      const { button } = connected(host);

      // Act
      await user.click(button);

      // Assert
      expect(host.changes).toEqual([true]);
    });

    it("asks the host to close an open collapsible", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith(true);
      const { button } = connected(host);

      // Act
      await user.click(button);

      // Assert
      expect(host.changes).toEqual([false]);
    });

    it("ignores a click while disabled", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { button } = connected(host, { disabled: true });

      // Act
      await user.click(button);

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("ignores a click outside the trigger", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { root } = connected(host);
      const outside = document.createElement("p");
      root.append(outside);

      // Act
      await user.click(outside);

      // Assert
      expect(host.changes).toEqual([]);
    });
  });

  describe("keyboard", () => {
    it.each([["Enter", "{Enter}"], ["Space", " "]])("toggles once on %s, suppressing the native click", async (_, key) => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { button } = connected(host);
      button.focus();

      // Act
      await user.keyboard(key);

      // Assert
      expect(host.changes).toEqual([true]);
    });

    it("toggles a non-button trigger, whose keys do not click natively", () => {
      // Arrange
      const host = hostWith();
      const root = document.createElement("div");
      const link = document.createElement("a");
      link.href = "#section";
      root.append(link);
      document.body.append(root);
      const controller = new CollapsibleController(root, host);
      controller.registerTrigger("trigger", link);
      controller.connect();
      const event = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });

      // Act
      link.dispatchEvent(event);

      // Assert
      expect(host.changes).toEqual([true]);
      expect(event.defaultPrevented).toBe(true);
    });

    it("leaves other keys alone", () => {
      // Arrange
      const host = hostWith();
      const { button } = connected(host);
      const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });

      // Act
      button.dispatchEvent(event);

      // Assert
      expect(host.changes).toEqual([]);
      expect(event.defaultPrevented).toBe(false);
    });

    it("leaves Enter alone while disabled", () => {
      // Arrange
      const host = hostWith();
      const { button } = connected(host, { disabled: true });
      const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });

      // Act
      button.dispatchEvent(event);

      // Assert
      expect(host.changes).toEqual([]);
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe("lifecycle", () => {
    it("stops listening once disconnected", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { button, controller } = connected(host);

      // Act
      controller.disconnect();
      await user.click(button);

      // Assert
      expect(host.changes).toEqual([]);
    });
  });
});
