import userEvent from "@testing-library/user-event";

import { ToggleGroupController, type ToggleGroupControllerHost } from "../ToggleGroupController";

type HostState = ReturnType<ToggleGroupControllerHost["state"]>;

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
    pressed: [],
    multiple: false,
    orientation: "horizontal",
    dir: "ltr",
    ...overrides,
  };
  const host: ToggleGroupControllerHost & { changes: string[][] } = {
    changes: [],
    state: () => state,
    change(value) {
      host.changes.push(value);
    },
  };
  return host;
}

/** A connected controller over `values`, with `disabled` registered as disabled. */
function connected(values: string[], host: ToggleGroupControllerHost, disabled: string[] = []) {
  const { root, buttons } = mount(values);
  const controller = new ToggleGroupController(root, host);
  values.forEach((value, index) =>
    controller.registerTrigger(value, buttons[index], { disabled: disabled.includes(value) }),
  );
  controller.connect();
  return { root, buttons, controller };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("ToggleGroupController", () => {
  describe("clicks", () => {
    it("asks the host to press a clicked item", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { buttons } = connected(["left", "right"], host);

      // Act
      await user.click(buttons[1]);

      // Assert
      expect(host.changes).toEqual([["right"]]);
    });

    it("asks the host to let go of a pressed item, keeping the others in multiple mode", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith({ pressed: ["left", "right"], multiple: true });
      const { buttons } = connected(["left", "right"], host);

      // Act
      await user.click(buttons[0]);

      // Assert
      expect(host.changes).toEqual([["right"]]);
    });

    it("ignores a click on a disabled item", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { buttons } = connected(["left", "right"], host, ["right"]);

      // Act
      await user.click(buttons[1]);

      // Assert
      expect(host.changes).toEqual([]);
    });
  });

  describe("keyboard", () => {
    it("moves focus to the next enabled item on ArrowRight without pressing it", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { buttons } = connected(["left", "center", "right"], host, ["center"]);
      buttons[0].focus();

      // Act
      await user.keyboard("{ArrowRight}");

      // Assert
      expect(buttons[2]).toBe(document.activeElement);
      expect(host.changes).toEqual([]);
    });

    it("reads orientation and direction from the host", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith({ orientation: "vertical", dir: "rtl" });
      const { buttons } = connected(["left", "right"], host);
      buttons[0].focus();

      // Act
      await user.keyboard("{ArrowDown}");

      // Assert
      expect(buttons[1]).toBe(document.activeElement);
    });

    it("toggles the focused item on Enter and prevents the key's default", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith({ pressed: ["left"], multiple: true });
      const { root, buttons } = connected(["left", "right"], host);
      let prevented: boolean | undefined;
      root.addEventListener("keydown", (event) => (prevented = event.defaultPrevented));
      buttons[1].focus();

      // Act
      await user.keyboard("{Enter}");

      // Assert
      expect(host.changes).toEqual([["left", "right"]]);
      expect(prevented).toBe(true);
      expect(buttons[1]).toBe(document.activeElement);
    });

    it("toggles once on Space, the key's click suppressed", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { buttons } = connected(["left"], host);
      buttons[0].focus();

      // Act
      await user.keyboard(" ");

      // Assert
      expect(host.changes).toEqual([["left"]]);
    });

    it("does not toggle a disabled item from the keyboard", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { buttons } = connected(["left"], host, ["left"]);
      buttons[0].focus();

      // Act
      await user.keyboard("{Enter}");

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("leaves a key it does not handle alone", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { root, buttons } = connected(["left", "right"], host);
      let prevented: boolean | undefined;
      root.addEventListener("keydown", (event) => (prevented = event.defaultPrevented));
      buttons[0].focus();

      // Act
      await user.keyboard("a");

      // Assert
      expect(prevented).toBe(false);
      expect(buttons[0]).toBe(document.activeElement);
    });
  });
});
