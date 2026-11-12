import userEvent from "@testing-library/user-event";

import { ListboxController, type ListboxControllerHost } from "../ListboxController";

type HostState = ReturnType<ListboxControllerHost["state"]>;

const FRUIT = ["Apple", "Avocado", "Banana"];

/** A focusable root holding one option element per label, valued by its lower-cased label. */
function mount(labels: string[]) {
  const root = document.createElement("div");
  root.tabIndex = 0;
  const options = labels.map((label) => {
    const option = document.createElement("div");
    option.textContent = label;
    root.append(option);
    return option;
  });
  document.body.append(root);
  return { root, options };
}

/** A host that records what it is asked to do and keeps the cursor it is given, as the elements do. */
function hostWith(overrides: Partial<HostState> = {}) {
  const state: HostState = {
    selected: [],
    active: undefined,
    multiple: false,
    selectionFollowsFocus: false,
    orientation: "vertical",
    dir: "ltr",
    ...overrides,
  };
  const host: ListboxControllerHost & { changes: string[][]; cursors: Array<string | undefined> } = {
    changes: [],
    cursors: [],
    state: () => state,
    change(selected) {
      host.changes.push(selected);
    },
    moveCursor(value) {
      host.cursors.push(value);
      state.active = value;
    },
  };
  return host;
}

/** A connected controller over `labels`, with `disabled` (by value) registered as disabled. */
function connected(labels: string[], host: ListboxControllerHost, disabled: string[] = []) {
  const { root, options } = mount(labels);
  const controller = new ListboxController(root, host);
  controller.setTriggers(
    labels.map((label, index) => ({
      value: label.toLowerCase(),
      element: options[index],
      disabled: disabled.includes(label.toLowerCase()),
    })),
  );
  controller.connect();
  return { root, options, controller };
}

let scrolled: Element[];
let scrollOptions: unknown[];

beforeEach(() => {
  scrolled = [];
  scrollOptions = [];
  // jsdom has no scrollIntoView; record which element was asked to scroll, and how.
  Element.prototype.scrollIntoView = function (this: Element, options?: unknown) {
    scrolled.push(this);
    scrollOptions.push(options);
  };
});

afterEach(() => {
  document.body.replaceChildren();
  vi.useRealTimers();
});

describe("ListboxController", () => {
  describe("focus", () => {
    it("seeds the cursor on the first selected option when the list takes focus", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith({ selected: ["banana"] });
      connected(FRUIT, host);

      // Act
      await user.tab();

      // Assert
      expect(host.cursors).toEqual(["banana"]);
    });

    it("seeds the cursor on the first enabled option when nothing is selected", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      connected(FRUIT, host, ["apple"]);

      // Act
      await user.tab();

      // Assert
      expect(host.cursors).toEqual(["avocado"]);
    });

    it("keeps a cursor that is already set when the list takes focus", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith({ active: "banana" });
      connected(FRUIT, host);

      // Act
      await user.tab();

      // Assert
      expect(host.cursors).toEqual([]);
    });

    it("clears the cursor when the list loses focus", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      connected(FRUIT, host);
      await user.tab();

      // Act
      await user.tab();

      // Assert
      expect(host.cursors).toEqual(["apple", undefined]);
    });
  });

  describe("clicks", () => {
    it("asks the host to select a clicked option and moves the cursor to it", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith({ selected: ["apple"] });
      const { options } = connected(FRUIT, host);

      // Act
      await user.click(options[2]);

      // Assert
      expect(host.changes).toEqual([["banana"]]);
      expect(host.cursors.at(-1)).toBe("banana");
    });

    it("toggles a clicked option in multiple mode without applying selection-follows-focus", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith({ multiple: true, selectionFollowsFocus: true, selected: ["apple"] });
      const { options } = connected(FRUIT, host);

      // Act
      await user.click(options[0]);

      // Assert
      expect(host.changes).toEqual([[]]);
    });

    it("finds the option a click lands inside", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { options } = connected(FRUIT, host);
      const icon = document.createElement("span");
      options[1].append(icon);

      // Act
      await user.click(icon);

      // Assert
      expect(host.changes).toEqual([["avocado"]]);
    });

    it("ignores a click on a disabled option", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { options } = connected(FRUIT, host, ["banana"]);

      // Act
      await user.click(options[2]);

      // Assert
      expect(host.changes).toEqual([]);
      expect(host.cursors).not.toContain("banana");
    });

    it("ignores a click on the list outside any option", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { root } = connected(FRUIT, host);

      // Act
      await user.click(root);

      // Assert
      expect(host.changes).toEqual([]);
    });
  });

  describe("keys", () => {
    it("moves the cursor and scrolls the option it lands on into view", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { options } = connected(FRUIT, host);
      await user.tab();

      // Act
      await user.keyboard("{ArrowDown}");

      // Assert
      expect(host.cursors.at(-1)).toBe("avocado");
      expect(scrolled.at(-1)).toBe(options[1]);
      expect(scrollOptions.at(-1)).toEqual({ block: "nearest" });
    });

    it("skips a disabled option", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      connected(FRUIT, host, ["avocado"]);
      await user.tab();

      // Act
      await user.keyboard("{ArrowDown}");

      // Assert
      expect(host.cursors.at(-1)).toBe("banana");
    });

    it("follows the options' DOM order, not their registration order", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { root, options } = connected(FRUIT, host);
      root.prepend(options[2]);
      await user.tab();

      // Act
      await user.keyboard("{ArrowDown}");

      // Assert
      expect(host.cursors).toEqual(["banana", "apple"]);
    });

    it("selects the option it lands on when selection follows focus", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith({ selectionFollowsFocus: true });
      connected(FRUIT, host);
      await user.tab();

      // Act
      await user.keyboard("{ArrowDown}");

      // Assert
      expect(host.changes).toEqual([["avocado"]]);
    });

    it("selects the option under the cursor on Enter, and prevents the key's default", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { root } = connected(FRUIT, host);
      await user.tab();
      let prevented: boolean | undefined;
      root.addEventListener("keydown", (event) => (prevented = event.defaultPrevented));

      // Act
      await user.keyboard("{Enter}");

      // Assert
      expect(host.changes).toEqual([["apple"]]);
      expect(prevented).toBe(true);
    });

    it("prevents the default of a key it takes that changes nothing", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith({ multiple: true });
      const { root } = connected(FRUIT, host);
      await user.tab();
      await user.keyboard("{End}");
      let prevented: boolean | undefined;
      root.addEventListener("keydown", (event) => (prevented = event.defaultPrevented));

      // Act
      await user.keyboard("{Shift>}{ArrowDown}{/Shift}");

      // Assert
      expect(prevented).toBe(true);
      expect(host.changes).toEqual([]);
    });

    it("selects every option with Ctrl+A in multiple mode", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith({ multiple: true });
      connected(FRUIT, host, ["avocado"]);
      await user.tab();

      // Act
      await user.keyboard("{Control>}a{/Control}");

      // Assert
      expect(host.changes).toEqual([["apple", "banana"]]);
    });

    it("leaves a key it does not handle alone", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { root } = connected(FRUIT, host);
      await user.tab();
      let prevented: boolean | undefined;
      root.addEventListener("keydown", (event) => (prevented = event.defaultPrevented));

      // Act
      await user.keyboard("{Escape}");

      // Assert
      expect(prevented).toBe(false);
      expect(host.cursors).toEqual(["apple"]);
    });
  });

  describe("typeahead", () => {
    it("moves the cursor to the next option starting with a typed letter", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { options } = connected(FRUIT, host);
      await user.tab();

      // Act
      await user.keyboard("a");

      // Assert
      expect(host.cursors.at(-1)).toBe("avocado");
      expect(scrolled.at(-1)).toBe(options[1]);
      expect(host.changes).toEqual([]);
    });

    it("narrows on a longer query typed quickly", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      connected(["Banana", "Blueberry", "Blackberry"], host);
      await user.tab();

      // Act
      await user.keyboard("bla");

      // Assert
      expect(host.cursors.at(-1)).toBe("blackberry");
    });

    it("starts a fresh query once the last one lapses", async () => {
      // Arrange
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const host = hostWith();
      connected(["Banana", "Lime", "Blueberry"], host);
      await user.tab();
      await user.keyboard("b");
      vi.advanceTimersByTime(500);

      // Act
      await user.keyboard("l");

      // Assert
      expect(host.cursors.at(-1)).toBe("lime");
    });

    it("keeps the query going while keys arrive inside the window", async () => {
      // Arrange
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const host = hostWith();
      connected(["Banana", "Lime", "Blueberry"], host);
      await user.tab();
      await user.keyboard("b");
      vi.advanceTimersByTime(499);

      // Act
      await user.keyboard("l");

      // Assert
      expect(host.cursors.at(-1)).toBe("blueberry");
    });

    it("selects the matched option when selection follows focus", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith({ selectionFollowsFocus: true });
      connected(FRUIT, host);
      await user.tab();

      // Act
      await user.keyboard("b");

      // Assert
      expect(host.changes).toEqual([["banana"]]);
    });

    it("prevents the default only of a key that matched", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { root } = connected(FRUIT, host);
      await user.tab();
      const prevented: boolean[] = [];
      root.addEventListener("keydown", (event) => prevented.push(event.defaultPrevented));

      // Act
      await user.keyboard("a");
      await user.keyboard("z");

      // Assert
      expect(prevented).toEqual([true, false]);
    });

    it("searches only the enabled options", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      connected(FRUIT, host, ["avocado"]);
      await user.tab();

      // Act
      await user.keyboard("a");

      // Assert
      expect(host.cursors.at(-1)).toBe("apple");
    });
  });

  describe("lifecycle", () => {
    it("stops listening once disconnected, and resumes on connect", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { options, controller } = connected(FRUIT, host);
      controller.disconnect();

      // Act
      await user.click(options[0]);
      controller.connect();
      await user.click(options[1]);

      // Assert
      expect(host.changes).toEqual([["avocado"]]);
    });

    it("stops seeding, clearing and handling keys once disconnected", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { controller } = connected(FRUIT, host);
      controller.disconnect();

      // Act
      await user.tab();
      await user.keyboard("{ArrowDown}b");
      await user.tab();

      // Assert
      expect(host.cursors).toEqual([]);
    });

    it("can be disconnected before it was ever connected", () => {
      // Arrange
      const { root } = mount(FRUIT);
      const controller = new ListboxController(root, hostWith());

      // Act & Assert
      expect(() => controller.disconnect()).not.toThrow();
    });

    it("handles keys before any option is registered without throwing", async () => {
      // Arrange
      const user = userEvent.setup();
      const errors: unknown[] = [];
      const onError = (event: ErrorEvent) => errors.push(event.error);
      window.addEventListener("error", onError);
      const host = hostWith();
      const { root } = mount(FRUIT);
      new ListboxController(root, host).connect();

      // Act
      await user.tab();
      await user.keyboard("{ArrowDown}a");
      window.removeEventListener("error", onError);

      // Assert
      expect(errors).toEqual([]);
      expect(host.cursors).toEqual([undefined]);
    });

    it("does not stack a second set of listeners when connected twice", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith({ multiple: true });
      const { options, controller } = connected(FRUIT, host);
      controller.connect();

      // Act
      await user.click(options[0]);

      // Assert
      expect(host.changes).toEqual([["apple"]]);
    });

    it("forgets options left out of the next hand-over", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith();
      const { options, controller } = connected(FRUIT, host);
      controller.setTriggers([{ value: "banana", element: options[2] }]);

      // Act
      await user.click(options[0]);
      await user.click(options[2]);

      // Assert
      expect(host.changes).toEqual([["banana"]]);
    });
  });
});
