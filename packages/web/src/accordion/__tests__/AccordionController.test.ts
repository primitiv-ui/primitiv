import userEvent from "@testing-library/user-event";

import { AccordionController, type AccordionControllerHost } from "../AccordionController";

type HostState = ReturnType<AccordionControllerHost["state"]>;

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
    expanded: [],
    multiple: false,
    orientation: "vertical",
    dir: "ltr",
    ...overrides,
  };
  const host: AccordionControllerHost & { changes: string[][] } = {
    changes: [],
    state: () => state,
    change(value) {
      host.changes.push(value);
    },
  };
  return host;
}

/** A connected controller over `values`, with `disabled` registered as disabled. */
function connected(values: string[], host: AccordionControllerHost, disabled: string[] = []) {
  const { root, buttons } = mount(values);
  const controller = new AccordionController(root, host);
  values.forEach((value, index) =>
    controller.registerTrigger(value, buttons[index], { disabled: disabled.includes(value) }),
  );
  controller.connect();
  return { root, buttons, controller };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("AccordionController", () => {
  describe("clicks", () => {
    it("asks the host to open a clicked item", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { buttons } = connected(["one", "two"], host);

      // Act
      await user.click(buttons[1]);

      // Assert
      expect(host.changes).toEqual([["two"]]);
    });

    it("asks the host to close a clicked open item, keeping others open in multiple mode", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith({ expanded: ["one", "two"], multiple: true });
      const { buttons } = connected(["one", "two"], host);

      // Act
      await user.click(buttons[0]);

      // Assert
      expect(host.changes).toEqual([["two"]]);
    });

    it("ignores a click on a disabled item", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { buttons } = connected(["one", "two"], host, ["two"]);

      // Act
      await user.click(buttons[1]);

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("ignores a click outside every trigger", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { root } = connected(["one"], host);
      const outside = document.createElement("p");
      root.append(outside);

      // Act
      await user.click(outside);

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("finds the trigger from a click on something inside it", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { buttons } = connected(["one"], host);
      const label = document.createElement("span");
      label.textContent = "label";
      buttons[0].append(label);

      // Act
      await user.click(label);

      // Assert
      expect(host.changes).toEqual([["one"]]);
    });
  });

  describe("keyboard", () => {
    it("moves focus to the next trigger on ArrowDown without toggling", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { buttons } = connected(["one", "two"], host);
      buttons[0].focus();

      // Act
      await user.keyboard("{ArrowDown}");

      // Assert
      expect(buttons[1]).toBe(document.activeElement);
      expect(host.changes).toEqual([]);
    });

    it("follows DOM order, not registration order", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { root, buttons } = mount(["one", "two", "three"]);
      const controller = new AccordionController(root, host);
      // Not a rotation of DOM order, so an unsorted collection would move to "three".
      controller.registerTrigger("one", buttons[0]);
      controller.registerTrigger("three", buttons[2]);
      controller.registerTrigger("two", buttons[1]);
      controller.connect();
      buttons[0].focus();

      // Act
      await user.keyboard("{ArrowDown}");

      // Assert
      expect(buttons[1]).toBe(document.activeElement);
    });

    it("skips a disabled trigger", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { buttons } = connected(["one", "two", "three"], host, ["two"]);
      buttons[0].focus();

      // Act
      await user.keyboard("{ArrowDown}");

      // Assert
      expect(buttons[2]).toBe(document.activeElement);
    });

    it("reads orientation and direction from the host", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith({ orientation: "horizontal", dir: "rtl" });
      const { buttons } = connected(["one", "two"], host);
      buttons[0].focus();

      // Act
      await user.keyboard("{ArrowLeft}");

      // Assert
      expect(buttons[1]).toBe(document.activeElement);
    });

    it("toggles the focused item on Enter and prevents the key's default", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith({ expanded: ["one"] });
      const { root, buttons } = connected(["one", "two"], host);
      let prevented: boolean | undefined;
      root.addEventListener("keydown", (event) => (prevented = event.defaultPrevented));
      buttons[1].focus();

      // Act
      await user.keyboard("{Enter}");

      // Assert
      expect(host.changes).toEqual([["two"]]);
      expect(prevented).toBe(true);
      expect(buttons[1]).toBe(document.activeElement);
    });

    it("toggles once on Space, the key's click suppressed", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { buttons } = connected(["one"], host);
      buttons[0].focus();

      // Act
      await user.keyboard(" ");

      // Assert
      expect(host.changes).toEqual([["one"]]);
    });

    it("leaves a key it does not handle alone", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { root, buttons } = connected(["one", "two"], host);
      let prevented: boolean | undefined;
      root.addEventListener("keydown", (event) => (prevented = event.defaultPrevented));
      buttons[0].focus();

      // Act
      await user.keyboard("a");

      // Assert
      expect(prevented).toBe(false);
      expect(buttons[0]).toBe(document.activeElement);
    });

    it("ignores a key pressed outside every trigger", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { root } = connected(["one"], host);
      const field = document.createElement("input");
      root.append(field);
      field.focus();

      // Act
      await user.keyboard("{Enter}");

      // Assert
      expect(host.changes).toEqual([]);
    });
  });

  describe("the collection", () => {
    it("replaces every trigger at once with setTriggers", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { buttons, controller } = connected(["one", "two", "three"], host);
      controller.setTriggers([
        { value: "one", element: buttons[0] },
        { value: "three", element: buttons[2], disabled: true },
      ]);
      buttons[0].focus();

      // Act
      await user.keyboard("{ArrowDown}");
      const focused = document.activeElement;
      await user.click(buttons[2]);
      await user.click(buttons[1]);
      await user.click(buttons[0]);

      // Assert
      expect(focused).toBe(buttons[0]);
      expect(host.changes).toEqual([["one"]]);
    });

    it("forgets an unregistered trigger", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { buttons, controller } = connected(["one", "two"], host);
      controller.unregisterTrigger(buttons[1]);

      // Act
      await user.click(buttons[1]);

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("updates a trigger registered again", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { buttons, controller } = connected(["one"], host);
      controller.registerTrigger("one", buttons[0], { disabled: true });

      // Act
      await user.click(buttons[0]);

      // Assert
      expect(host.changes).toEqual([]);
    });
  });

  describe("lifecycle", () => {
    it("stops listening once disconnected, and resumes on connect", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { buttons, controller } = connected(["one"], host);

      // Act
      controller.disconnect();
      await user.click(buttons[0]);
      await user.keyboard("{Enter}");
      const whileDisconnected = host.changes.length;
      controller.connect();
      await user.click(buttons[0]);

      // Assert
      expect(whileDisconnected).toBe(0);
      expect(host.changes).toEqual([["one"]]);
    });

    it("never stacks a second set of handlers when connected twice", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { buttons, controller } = connected(["one"], host);
      controller.connect();

      // Act
      await user.click(buttons[0]);

      // Assert
      expect(host.changes).toEqual([["one"]]);
    });

    it("can be disconnected before it ever connected", () => {
      // Arrange
      const { root } = mount(["one"]);
      const controller = new AccordionController(root, hostWith());

      // Act & Assert
      expect(() => controller.disconnect()).not.toThrow();
    });
  });
});
