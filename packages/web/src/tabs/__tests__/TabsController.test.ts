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
});
