import userEvent from "@testing-library/user-event";

import { TabsController, type TabsControllerHost } from "../TabsController";

type HostState = ReturnType<TabsControllerHost["state"]>;

/** Mounts a root holding one `<button>` per value and returns the buttons. */
function mount(values: string[]) {
  const root = document.createElement("div");
  const buttons = values.map((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = value;
    root.append(button);
    return button;
  });
  document.body.append(root);
  return { root, buttons };
}

function hostWith(overrides: Partial<HostState> = {}) {
  const state: HostState = {
    active: "one",
    orientation: "horizontal",
    dir: "ltr",
    activationMode: "automatic",
    ...overrides,
  };
  const host: TabsControllerHost & { activations: Array<[string, number]> } = {
    activations: [],
    state: () => state,
    activate(value, index) {
      host.activations.push([value, index]);
    },
  };
  return host;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("TabsController", () => {
  describe("clicks", () => {
    it("asks the host to activate a clicked tab, with its index", async () => {
      // Arrange
      const user = userEvent.setup();
      const { root, buttons } = mount(["one", "two"]);
      const host = hostWith();
      const controller = new TabsController(root, host);
      controller.registerTrigger("one", buttons[0]);
      controller.registerTrigger("two", buttons[1]);
      controller.connect();

      // Act
      await user.click(buttons[1]);

      // Assert
      expect(host.activations).toEqual([["two", 1]]);
    });

    it("ignores a click on a disabled tab", async () => {
      // Arrange
      const user = userEvent.setup();
      const { root, buttons } = mount(["one", "two"]);
      const host = hostWith();
      const controller = new TabsController(root, host);
      controller.registerTrigger("one", buttons[0]);
      controller.registerTrigger("two", buttons[1], { disabled: true });
      controller.connect();

      // Act
      await user.click(buttons[1]);

      // Assert
      expect(host.activations).toEqual([]);
    });

    it("ignores a click outside every trigger", async () => {
      // Arrange
      const user = userEvent.setup();
      const { root, buttons } = mount(["one", "two"]);
      const outside = document.createElement("p");
      root.append(outside);
      const host = hostWith();
      const controller = new TabsController(root, host);
      controller.registerTrigger("one", buttons[0]);
      controller.registerTrigger("two", buttons[1]);
      controller.connect();

      // Act
      await user.click(outside);

      // Assert
      expect(host.activations).toEqual([]);
    });
  });

  describe("keyboard", () => {
    it("moves focus to the next tab and activates it on ArrowRight", async () => {
      // Arrange
      const user = userEvent.setup();
      const { root, buttons } = mount(["one", "two"]);
      const host = hostWith();
      const controller = new TabsController(root, host);
      controller.registerTrigger("one", buttons[0]);
      controller.registerTrigger("two", buttons[1]);
      controller.connect();
      buttons[0].focus();

      // Act
      await user.keyboard("{ArrowRight}");

      // Assert
      expect(host.activations).toEqual([["two", 1]]);
      expect(buttons[1]).toBe(document.activeElement);
    });

    it("moves focus without activating in manual mode", async () => {
      // Arrange
      const user = userEvent.setup();
      const { root, buttons } = mount(["one", "two"]);
      const host = hostWith({ activationMode: "manual" });
      const controller = new TabsController(root, host);
      controller.registerTrigger("one", buttons[0]);
      controller.registerTrigger("two", buttons[1]);
      controller.connect();
      buttons[0].focus();

      // Act
      await user.keyboard("{ArrowRight}");

      // Assert
      expect(host.activations).toEqual([]);
      expect(buttons[1]).toBe(document.activeElement);
    });

    it("follows the host's orientation and reading direction", async () => {
      // Arrange
      const user = userEvent.setup();
      const { root, buttons } = mount(["one", "two"]);
      const host = hostWith({ orientation: "vertical" });
      const controller = new TabsController(root, host);
      controller.registerTrigger("one", buttons[0]);
      controller.registerTrigger("two", buttons[1]);
      controller.connect();
      buttons[0].focus();

      // Act
      await user.keyboard("{ArrowRight}{ArrowDown}");

      // Assert
      expect(host.activations).toEqual([["two", 1]]);
    });

    it("prevents the default action only for the keys it handles", () => {
      // Arrange
      const { root, buttons } = mount(["one", "two"]);
      const controller = new TabsController(root, hostWith());
      controller.registerTrigger("one", buttons[0]);
      controller.registerTrigger("two", buttons[1]);
      controller.connect();
      const handled = new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true });
      const ignored = new KeyboardEvent("keydown", { key: "a", bubbles: true, cancelable: true });

      // Act
      buttons[0].dispatchEvent(handled);
      buttons[0].dispatchEvent(ignored);

      // Assert
      expect(handled.defaultPrevented).toBe(true);
      expect(ignored.defaultPrevented).toBe(false);
    });

    it("ignores key presses that do not come from a trigger", () => {
      // Arrange
      const { root, buttons } = mount(["one", "two"]);
      const field = document.createElement("input");
      root.append(field);
      const host = hostWith();
      const controller = new TabsController(root, host);
      controller.registerTrigger("one", buttons[0]);
      controller.registerTrigger("two", buttons[1]);
      controller.connect();
      const event = new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true });

      // Act
      field.dispatchEvent(event);

      // Assert
      expect(event.defaultPrevented).toBe(false);
      expect(host.activations).toEqual([]);
    });
  });
});
