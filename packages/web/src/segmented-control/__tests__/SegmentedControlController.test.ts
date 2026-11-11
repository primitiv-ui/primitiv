import userEvent from "@testing-library/user-event";

import { SegmentedControlController, type SegmentedControlControllerHost } from "../SegmentedControlController";

type HostState = ReturnType<SegmentedControlControllerHost["state"]>;

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
    selected: undefined,
    disabled: false,
    orientation: "horizontal",
    dir: "ltr",
    ...overrides,
  };
  const host: SegmentedControlControllerHost & { changes: string[] } = {
    changes: [],
    state: () => state,
    change(value) {
      host.changes.push(value);
    },
  };
  return host;
}

/** A connected controller over `values`, with `disabled` registered as disabled. */
function connected(values: string[], host: SegmentedControlControllerHost, disabled: string[] = []) {
  const { root, buttons } = mount(values);
  const controller = new SegmentedControlController(root, host);
  values.forEach((value, index) =>
    controller.registerTrigger(value, buttons[index], { disabled: disabled.includes(value) }),
  );
  controller.connect();
  return { root, buttons, controller };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("SegmentedControlController", () => {
  describe("clicks", () => {
    it("asks the host to select a clicked segment", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { buttons } = connected(["day", "week"], host);

      // Act
      await user.click(buttons[1]);

      // Assert
      expect(host.changes).toEqual(["week"]);
    });

    it("asks nothing for the segment already selected, or a disabled one", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith({ selected: "day" });
      const { buttons } = connected(["day", "week"], host, ["week"]);

      // Act
      await user.click(buttons[0]);
      await user.click(buttons[1]);

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("asks nothing while the whole control is disabled", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith({ disabled: true });
      const { buttons } = connected(["day", "week"], host);

      // Act
      await user.click(buttons[1]);

      // Assert
      expect(host.changes).toEqual([]);
    });
  });

  describe("keys", () => {
    it("moves focus and selection with the arrows, preventing the default", async () => {
      // Arrange
      const host = hostWith({ selected: "day" });
      const { buttons } = connected(["day", "week", "month"], host);
      buttons[0].focus();
      const event = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true });

      // Act
      buttons[0].dispatchEvent(event);

      // Assert
      expect(event.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(buttons[1]);
      expect(host.changes).toEqual(["week"]);
    });

    it("skips a disabled segment", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { buttons } = connected(["day", "week", "month"], host, ["week"]);
      buttons[0].focus();

      // Act
      await user.keyboard("{ArrowRight}");

      // Assert
      expect(document.activeElement).toBe(buttons[2]);
      expect(host.changes).toEqual(["month"]);
    });

    it("focuses without asking when the arrows land on the selected segment", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith({ selected: "day" });
      const { buttons } = connected(["day", "week"], host, ["week"]);
      buttons[0].focus();

      // Act
      await user.keyboard("{ArrowRight}");

      // Assert
      expect(document.activeElement).toBe(buttons[0]);
      expect(host.changes).toEqual([]);
    });

    it("reads the orientation and direction from the host", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith({ orientation: "vertical", dir: "rtl" });
      const { buttons } = connected(["day", "week"], host);
      buttons[0].focus();

      // Act
      await user.keyboard("{ArrowLeft}{ArrowDown}");

      // Assert
      expect(host.changes).toEqual(["week"]);
    });

    it("mirrors the horizontal arrows right to left", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith({ dir: "rtl" });
      const { buttons } = connected(["day", "week", "month"], host);
      buttons[0].focus();

      // Act
      await user.keyboard("{ArrowLeft}");

      // Assert
      expect(host.changes).toEqual(["week"]);
    });

    it("does nothing while the whole control is disabled, leaving the key alone", async () => {
      // Arrange
      const host = hostWith({ disabled: true });
      const { buttons } = connected(["day", "week"], host);
      const event = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true });

      // Act
      buttons[0].dispatchEvent(event);

      // Assert
      expect(event.defaultPrevented).toBe(false);
      expect(host.changes).toEqual([]);
    });
  });
});
