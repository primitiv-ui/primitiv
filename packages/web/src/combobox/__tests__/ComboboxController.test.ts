import "../../select/__tests__/popover-polyfill";

import userEvent from "@testing-library/user-event";

import { ComboboxController, type ComboboxControllerHost, type ComboboxOption } from "../ComboboxController";

type Recorded = ComboboxControllerHost & {
  open: boolean;
  value: string;
  active: string | undefined;
  log: string[];
};

/** A host that keeps its state in plain fields and logs every call it is asked to make. */
function recordingHost(root: HTMLElement, { open = false, value = "" } = {}, extra: Partial<ComboboxControllerHost> = {}): Recorded {
  const host: Recorded = {
    open,
    value,
    active: undefined,
    log: [],
    state: () => ({ open: host.open, value: host.value, active: host.active }),
    input: () => root.querySelector("input"),
    content: () => root.querySelector<HTMLElement>("[popover]"),
    change(next) {
      host.log.push(`change:${next}`);
      host.open = next;
    },
    query(text) {
      host.log.push(`query:${text}`);
    },
    select(next, label) {
      host.log.push(`select:${next}:${label}`);
      host.value = next;
      host.open = false;
    },
    clear() {
      host.log.push("clear");
      host.value = "";
    },
    dismiss() {
      host.log.push("dismiss");
      host.open = false;
    },
    moveCursor(next) {
      host.log.push(`cursor:${next}`);
      host.active = next;
    },
    ...extra,
  };
  return host;
}

const OPTIONS: Array<{ value: string; label: string; disabled?: boolean; hidden?: boolean }> = [
  { value: "react", label: "React" },
  { value: "preact", label: "Preact", disabled: true },
  { value: "solid", label: "Solid", hidden: true },
  { value: "svelte", label: "Svelte" },
  { value: "vue", label: "Vue" },
];

/** A root holding a field and a popup of `options`, with a connected controller. */
function connected(state: { open?: boolean; value?: string } = {}, { options = OPTIONS, extra = {} as Partial<ComboboxControllerHost> } = {}) {
  const items = options
    .map((o) => `<div role="option" data-value="${o.value}"${o.hidden ? " hidden" : ""}>${o.label}</div>`)
    .join("");
  document.body.innerHTML = `<button id="outside">Outside</button><div id="root"><span id="control"><input aria-label="Framework"></span><div id="list" role="listbox" popover="auto">${items}</div></div>`;
  const root = document.getElementById("root") as HTMLElement;
  const input = root.querySelector("input") as HTMLInputElement;
  const list = document.getElementById("list") as HTMLElement;
  const host = recordingHost(root, state, extra);
  const controller = new ComboboxController(root, host);
  const elements = [...list.querySelectorAll<HTMLElement>('[role="option"]')];
  const registered: ComboboxOption[] = options.map((o, i) => ({ value: o.value, element: elements[i], disabled: o.disabled, label: o.label }));
  controller.setTriggers(registered);
  controller.connect();
  return { root, input, list, host, controller };
}

const shown = (list: HTMLElement) => list.hasAttribute("data-popover-open");
const option = (value: string) => document.querySelector<HTMLElement>(`[data-value="${value}"]`) as HTMLElement;

beforeAll(() => {
  // jsdom has no scrollIntoView; the cursor asks for it on every move.
  Element.prototype.scrollIntoView = () => {};
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("ComboboxController", () => {
  describe("sync", () => {
    it("shows the popup while the host is open", () => {
      // Arrange
      const { list, controller } = connected({ open: true });

      // Act
      controller.sync();

      // Assert
      expect(shown(list)).toBe(true);
    });

    it("anchors the popup to the root's child that holds the field", () => {
      // Arrange
      const { list, controller } = connected({ open: true });
      const showPopover = vi.spyOn(list, "showPopover");

      // Act
      controller.sync();

      // Assert
      expect(showPopover).toHaveBeenCalledWith({ source: document.getElementById("control") });
    });

    it("anchors the popup to the field itself when the child holding it has no box", () => {
      // Arrange
      const { input, list, controller } = connected({ open: true });
      (document.getElementById("control") as HTMLElement).style.display = "contents";
      const showPopover = vi.spyOn(list, "showPopover");

      // Act
      controller.sync();

      // Assert
      expect(showPopover).toHaveBeenCalledWith({ source: input });
    });

    it("shows the popup with no source when there is no field", () => {
      // Arrange
      const { list, controller } = connected({ open: true }, { extra: { input: () => null } });
      const showPopover = vi.spyOn(list, "showPopover");

      // Act
      controller.sync();

      // Assert
      expect(showPopover).toHaveBeenCalledWith();
    });

    it("keeps focus in the field as the popup opens", async () => {
      // Arrange
      const user = userEvent.setup();
      const { input, controller, host } = connected();
      await user.click(input);
      host.open = true;

      // Act
      controller.sync();

      // Assert
      expect(document.activeElement).toBe(input);
    });

    it("shows the popup once however often it syncs", () => {
      // Arrange
      const { list, controller } = connected({ open: true });
      const showPopover = vi.spyOn(list, "showPopover");

      // Act
      controller.sync();
      controller.sync();

      // Assert
      expect(showPopover).toHaveBeenCalledTimes(1);
      expect(shown(list)).toBe(true);
    });

    it("hides the popup once the host closes", () => {
      // Arrange
      const { list, controller, host } = connected({ open: true });
      controller.sync();
      host.open = false;

      // Act
      controller.sync();

      // Assert
      expect(shown(list)).toBe(false);
    });

    it("hides nothing it did not show", () => {
      // Arrange
      const { list, controller } = connected();
      const hidePopover = vi.spyOn(list, "hidePopover");

      // Act
      controller.sync();

      // Assert
      expect(hidePopover).not.toHaveBeenCalled();
      expect(shown(list)).toBe(false);
    });

    it("tolerates a popup that is no longer a popover when it hides", () => {
      // Arrange
      const { list, controller, host } = connected({ open: true });
      controller.sync();
      vi.spyOn(list, "hidePopover").mockImplementation(() => {
        throw new DOMException("Not a popover", "NotSupportedError");
      });
      host.open = false;

      // Act & Assert
      expect(() => controller.sync()).not.toThrow();
    });

    it("waits for a popup to arrive, then shows it", () => {
      // Arrange
      let content: HTMLElement | null = null;
      const { list, controller } = connected({ open: true }, { extra: { content: () => content } });
      controller.sync();
      content = list;

      // Act
      controller.sync();

      // Assert
      expect(shown(list)).toBe(true);
    });

    it("shows a popup that replaced the shown one", () => {
      // Arrange
      let content: HTMLElement | null = null;
      const { list, root, controller } = connected({ open: true }, { extra: { content: () => content } });
      content = list;
      controller.sync();
      const replacement = list.cloneNode(true) as HTMLElement;
      replacement.removeAttribute("data-popover-open");
      list.replaceWith(replacement);
      content = replacement;

      // Act
      controller.sync();

      // Assert
      expect(root.contains(replacement)).toBe(true);
      expect(shown(replacement)).toBe(true);
    });

    it("shows the popup again after a disconnect and reconnect", () => {
      // Arrange
      const { list, controller } = connected({ open: true });
      controller.sync();
      controller.disconnect();
      list.hidePopover();
      controller.connect();

      // Act
      controller.sync();

      // Assert
      expect(shown(list)).toBe(true);
    });
  });

  describe("typing", () => {
    it("reports the query and opens the popup", async () => {
      // Arrange
      const user = userEvent.setup();
      const { input, host } = connected();

      // Act
      await user.type(input, "r");

      // Assert
      expect(host.log).toEqual(["query:r", "change:true"]);
    });

    it("asks to open only while closed", async () => {
      // Arrange
      const user = userEvent.setup();
      const { input, host } = connected({ open: true });

      // Act
      await user.type(input, "r");

      // Assert
      expect(host.log).toEqual(["query:r"]);
    });

    it("clears the value when the field is emptied", async () => {
      // Arrange
      const user = userEvent.setup();
      const { input, host } = connected({ value: "react" });
      input.value = "R";

      // Act
      await user.type(input, "{Backspace}");

      // Assert
      expect(host.log).toEqual(["query:", "change:true", "clear"]);
    });

    it("ignores input from anything but the field", () => {
      // Arrange
      const { list, host } = connected();

      // Act
      list.dispatchEvent(new Event("input", { bubbles: true }));

      // Assert
      expect(host.log).toEqual([]);
    });
  });

  describe("keyboard", () => {
    it("opens on ArrowDown while closed, placing no cursor", async () => {
      // Arrange
      const user = userEvent.setup();
      const { input, host } = connected();
      input.focus();

      // Act
      await user.keyboard("{ArrowDown}");

      // Assert
      expect(host.log).toEqual(["change:true"]);
    });

    it("moves the cursor over the shown, enabled options and scrolls it into view", async () => {
      // Arrange
      const user = userEvent.setup();
      const { input, host } = connected({ open: true });
      const scrollIntoView = vi.spyOn(option("svelte"), "scrollIntoView");
      input.focus();

      // Act
      await user.keyboard("{ArrowDown}{ArrowDown}");

      // Assert
      expect(host.log).toEqual(["cursor:react", "cursor:svelte"]);
      expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
    });

    it("walks the options in document order, whatever order they were registered in", async () => {
      // Arrange
      const user = userEvent.setup();
      const { input, host, controller } = connected({ open: true });
      const elements = [...document.querySelectorAll<HTMLElement>('[role="option"]')];
      controller.setTriggers([
        { value: "vue", element: elements[4], label: "Vue" },
        { value: "react", element: elements[0], label: "React" },
      ]);
      input.focus();

      // Act
      await user.keyboard("{ArrowDown}{ArrowDown}");

      // Assert
      expect(host.log).toEqual(["cursor:react", "cursor:vue"]);
    });

    it("prevents the default of a key it takes", () => {
      // Arrange
      const { input } = connected({ open: true });
      const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });

      // Act
      input.dispatchEvent(event);

      // Assert
      expect(event.defaultPrevented).toBe(true);
    });

    it("leaves the default of a key it does not take", () => {
      // Arrange
      const { input, host } = connected({ open: true });
      const event = new KeyboardEvent("keydown", { key: "a", bubbles: true, cancelable: true });

      // Act
      input.dispatchEvent(event);

      // Assert
      expect(event.defaultPrevented).toBe(false);
      expect(host.log).toEqual([]);
    });

    it("commits the option under the cursor on Enter, with its label, and clears the cursor", async () => {
      // Arrange
      const user = userEvent.setup();
      const { input, host } = connected({ open: true });
      input.focus();

      // Act
      await user.keyboard("{End}{Enter}");

      // Assert
      expect(host.log).toEqual(["cursor:vue", "select:vue:Vue", "cursor:undefined"]);
    });

    it("commits the option's value as its label when it has none", async () => {
      // Arrange
      const user = userEvent.setup();
      const { input, host, controller } = connected({ open: true });
      controller.setTriggers([{ value: "react", element: option("react") }]);
      input.focus();

      // Act
      await user.keyboard("{ArrowDown}{Enter}");

      // Assert
      expect(host.log.at(-2)).toBe("select:react:react");
    });

    it("dismisses on Escape while open", async () => {
      // Arrange
      const user = userEvent.setup();
      const { input, host } = connected({ open: true });
      input.focus();

      // Act
      await user.keyboard("{Escape}");

      // Assert
      expect(host.log).toEqual(["dismiss"]);
    });

    it("ignores keys from anything but the field", () => {
      // Arrange
      const { list, host } = connected({ open: true });

      // Act
      list.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));

      // Assert
      expect(host.log).toEqual([]);
    });
  });

  describe("clicking", () => {
    it("commits a clicked option, clears the cursor and hands focus back to the field", async () => {
      // Arrange
      const user = userEvent.setup();
      const { input, host, controller } = connected({ open: true });
      controller.sync();

      // Act
      await user.click(option("svelte"));

      // Assert
      expect(host.log).toEqual(["select:svelte:Svelte", "cursor:undefined"]);
      expect(document.activeElement).toBe(input);
    });

    it("commits an option clicked on something inside it", async () => {
      // Arrange
      const user = userEvent.setup();
      const { host } = connected({ open: true });
      option("vue").innerHTML = "<span>Vue</span>";

      // Act
      await user.click(option("vue").firstElementChild as HTMLElement);

      // Assert
      expect(host.log[0]).toBe("select:vue:Vue");
    });

    it("commits a clicked option with no field to hand focus to", async () => {
      // Arrange
      const user = userEvent.setup();
      const { host } = connected({ open: true }, { extra: { input: () => null } });

      // Act
      await user.click(option("react"));

      // Assert
      expect(host.log).toEqual(["select:react:React", "cursor:undefined"]);
    });

    it("never commits a disabled option, or a click outside every option", async () => {
      // Arrange
      const user = userEvent.setup();
      const { list, host } = connected({ open: true });

      // Act
      await user.click(option("preact"));
      list.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      // Assert
      expect(host.log).toEqual([]);
    });
  });

  describe("light dismiss", () => {
    it("dismisses when the browser closes the popup it showed", () => {
      // Arrange
      const { list, controller, host } = connected({ open: true });
      controller.sync();

      // Act
      list.hidePopover();

      // Assert
      expect(host.log).toEqual(["dismiss"]);
    });

    it("does not hear its own hide as a dismissal", () => {
      // Arrange
      const { controller, host } = connected({ open: true });
      controller.sync();
      host.open = false;

      // Act
      controller.sync();

      // Assert
      expect(host.log).toEqual([]);
    });

    it("ignores an opening toggle and a toggle from another popover", () => {
      // Arrange
      const { root, list, controller, host } = connected({ open: true });
      controller.sync();
      const other = document.createElement("div");
      other.setAttribute("popover", "auto");
      root.append(other);

      // Act
      other.showPopover();
      other.hidePopover();

      // Assert
      expect(shown(list)).toBe(true);
      expect(host.log).toEqual([]);
    });
  });

  describe("lifecycle", () => {
    it("has no options until they are handed over", async () => {
      // Arrange
      const user = userEvent.setup();
      document.body.innerHTML = `<div id="root"><input aria-label="Framework"><div role="option">React</div></div>`;
      const root = document.getElementById("root") as HTMLElement;
      const host = recordingHost(root, { open: true });
      new ComboboxController(root, host).connect();
      (root.querySelector("input") as HTMLInputElement).focus();

      // Act
      await user.keyboard("{ArrowDown}");
      await user.click(root.querySelector('[role="option"]') as HTMLElement);

      // Assert
      expect(host.log).toEqual([]);
    });

    it("connects once however often it is asked", async () => {
      // Arrange
      const user = userEvent.setup();
      const { input, host, controller } = connected();
      controller.connect();

      // Act
      await user.type(input, "r");

      // Assert
      expect(host.log).toEqual(["query:r", "change:true"]);
    });

    it("stops listening once disconnected", async () => {
      // Arrange
      const user = userEvent.setup();
      const { input, host, controller } = connected({ open: true });
      controller.disconnect();

      // Act
      await user.type(input, "r{ArrowDown}");
      await user.click(option("react"));
      controller.disconnect();

      // Assert
      expect(host.log).toEqual([]);
    });
  });
});
