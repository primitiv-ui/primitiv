import "./popover-polyfill";

import userEvent from "@testing-library/user-event";

import { SelectController, type SelectControllerHost } from "../SelectController";

type Recorded = SelectControllerHost & { changes: boolean[]; selections: string[]; open: boolean };

/** A host that starts `open`, records every change and selection, and owns `trigger`. */
function hostWith(open: boolean, trigger: HTMLElement, extra: Partial<SelectControllerHost> = {}): Recorded {
  const host: Recorded = {
    open,
    changes: [],
    selections: [],
    state: () => ({ open: host.open }),
    change(next) {
      host.changes.push(next);
    },
    select(value) {
      host.selections.push(value);
    },
    trigger: () => trigger,
    ...extra,
  };
  return host;
}

const OPTIONS = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana", disabled: true },
  { value: "blueberry", label: "Blueberry" },
  { value: "cherry", label: "Cherry" },
];

/** A trigger, an outside button and a connected controller over a listbox of `options`. */
function connected(open = false, { selected = "", options = OPTIONS, extra = {} }: { selected?: string; options?: typeof OPTIONS; extra?: Partial<SelectControllerHost> } = {}) {
  const items = options
    .map(
      (o) =>
        `<div role="option" tabindex="-1" aria-selected="${o.value === selected}"${o.disabled ? ' aria-disabled="true"' : ""}>${o.label}</div>`,
    )
    .join("");
  document.body.innerHTML = `<button id="trigger">Open</button><button id="outside">Outside</button><div id="list" role="listbox" tabindex="-1" popover="auto">${items}</div>`;
  const trigger = document.getElementById("trigger") as HTMLButtonElement;
  const list = document.getElementById("list") as HTMLElement;
  const host = hostWith(open, trigger, extra);
  const controller = new SelectController(list, host);
  const elements = [...list.querySelectorAll<HTMLElement>('[role="option"]')];
  controller.setTriggers(options.map((o, i) => ({ value: o.value, element: elements[i], disabled: o.disabled })));
  controller.connect();
  return { trigger, list, host, controller };
}

const shown = (list: HTMLElement) => list.hasAttribute("data-popover-open");
const option = (name: string) =>
  [...document.querySelectorAll<HTMLElement>('[role="option"]')].find((o) => o.textContent === name) as HTMLElement;

afterEach(() => {
  document.body.replaceChildren();
});

describe("SelectController", () => {
  describe("sync", () => {
    it("shows the list and focuses the selected option", () => {
      // Arrange
      const { list, controller } = connected(true, { selected: "cherry" });

      // Act
      controller.sync();

      // Assert
      expect(shown(list)).toBe(true);
      expect(document.activeElement).toBe(option("Cherry"));
    });

    it("focuses the first enabled option when nothing is selected", () => {
      // Arrange
      const { controller } = connected(true, {
        options: [{ value: "banana", label: "Banana", disabled: true }, ...OPTIONS.slice(2)],
      });

      // Act
      controller.sync();

      // Assert
      expect(document.activeElement).toBe(option("Blueberry"));
    });

    it("focuses the list itself when it has no options", () => {
      // Arrange
      const { list, controller } = connected(true, { options: [] });

      // Act
      controller.sync();

      // Assert
      expect(document.activeElement).toBe(list);
    });

    it("hands the browser the anchor to position against", () => {
      // Arrange
      const anchor = document.createElement("span");
      const { list, controller } = connected(true, { extra: { source: () => anchor } });
      const showPopover = vi.spyOn(list, "showPopover");

      // Act
      controller.sync();

      // Assert
      expect(showPopover).toHaveBeenCalledWith({ source: anchor });
    });

    it("hides the list once the host closes, and shows it only once while open", () => {
      // Arrange
      const { list, host, controller } = connected(true);
      const showPopover = vi.spyOn(list, "showPopover");
      controller.sync();
      controller.sync();
      const stillShown = shown(list);

      // Act
      host.open = false;
      controller.sync();
      controller.sync();

      // Assert
      expect(stillShown).toBe(true);
      expect(showPopover).toHaveBeenCalledTimes(1);
      expect(shown(list)).toBe(false);
    });

    it("never hides a list it did not show", () => {
      // Arrange
      const { list, controller } = connected(false);
      const hidePopover = vi.spyOn(list, "hidePopover");

      // Act
      controller.sync();

      // Assert
      expect(hidePopover).not.toHaveBeenCalled();
    });

    it("shows the list again when it reopens after closing", () => {
      // Arrange
      const { list, host, controller } = connected(true);
      controller.sync();
      host.open = false;
      controller.sync();

      // Act
      host.open = true;
      controller.sync();

      // Assert
      expect(shown(list)).toBe(true);
    });

    it("shows the list again when it reopens after a close the browser could not perform", () => {
      // Arrange — a browser throws, and fires no toggle event, hiding an
      // element that is no longer a popover.
      const { list, host, controller } = connected(true);
      controller.sync();
      const hidePopover = vi.spyOn(list, "hidePopover").mockImplementation(() => {
        throw new DOMException("Not a popover", "NotSupportedError");
      });
      host.open = false;
      controller.sync();
      hidePopover.mockRestore();
      const showPopover = vi.spyOn(list, "showPopover").mockImplementation(() => {});

      // Act
      host.open = true;
      controller.sync();

      // Assert
      expect(showPopover).toHaveBeenCalledTimes(1);
    });

    it("shows the list with no source when the host's source is missing", () => {
      // Arrange
      const { list, controller } = connected(true, { extra: { source: () => null } });
      const showPopover = vi.spyOn(list, "showPopover");

      // Act
      controller.sync();

      // Assert
      expect(showPopover).toHaveBeenCalledWith();
    });

    it("does not throw hiding a list the browser already hid", () => {
      // Arrange
      const { list, host, controller } = connected(true);
      controller.sync();
      list.removeAttribute("popover");

      // Act & Assert
      host.open = false;
      expect(() => controller.sync()).not.toThrow();
    });
  });

  describe("dismissal", () => {
    it("reports the browser closing the list, without moving focus", () => {
      // Arrange
      const { list, trigger, host, controller } = connected(true);
      controller.sync();

      // Act
      list.hidePopover();

      // Assert
      expect(host.changes).toEqual([false]);
      expect(document.activeElement).not.toBe(trigger);
    });

    it("shows the list again when it reopens after a light dismiss", () => {
      // Arrange
      const { list, controller } = connected(true);
      controller.sync();
      list.hidePopover();

      // Act
      controller.sync();

      // Assert
      expect(shown(list)).toBe(true);
    });

    it("ignores the browser opening the list", () => {
      // Arrange
      const { list, host } = connected(false);

      // Act
      list.showPopover();

      // Assert
      expect(host.changes).toEqual([]);
    });
  });

  describe("keys", () => {
    it("moves focus through the enabled options, skipping a disabled one", async () => {
      // Arrange
      const user = userEvent.setup();
      const { controller } = connected(true, { selected: "apple" });
      controller.sync();

      // Act
      await user.keyboard("{ArrowDown}");

      // Assert
      expect(document.activeElement).toBe(option("Blueberry"));
    });

    it("chooses the focused option on Enter, closing and handing focus back to the trigger", async () => {
      // Arrange
      const user = userEvent.setup();
      const { trigger, host, controller } = connected(true, { selected: "apple" });
      controller.sync();

      // Act
      await user.keyboard("{End}{Enter}");

      // Assert
      expect(host.selections).toEqual(["cherry"]);
      expect(host.changes).toEqual([false]);
      expect(document.activeElement).toBe(trigger);
    });

    it("closes on Escape and hands focus back to the trigger", async () => {
      // Arrange
      const user = userEvent.setup();
      const { trigger, host, controller } = connected(true);
      controller.sync();

      // Act
      await user.keyboard("{Escape}");

      // Assert
      expect(host.changes).toEqual([false]);
      expect(host.selections).toEqual([]);
      expect(document.activeElement).toBe(trigger);
    });

    it("focuses the next option starting with a typed letter, and lapses the query", async () => {
      // Arrange
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const { controller } = connected(true, { selected: "apple" });
      controller.sync();

      // Act
      await user.keyboard("b");
      const first = document.activeElement;
      vi.advanceTimersByTime(500);
      await user.keyboard("c");

      // Assert
      expect(first).toBe(option("Blueberry"));
      expect(document.activeElement).toBe(option("Cherry"));
      vi.useRealTimers();
    });

    it("keeps a quick query going and leaves an unmatched key alone", async () => {
      // Arrange
      const user = userEvent.setup();
      const { list, controller } = connected(true, { selected: "apple" });
      controller.sync();
      const prevented: boolean[] = [];
      list.addEventListener("keydown", (event) => prevented.push(event.defaultPrevented));

      // Act
      await user.keyboard("chz");

      // Assert
      expect(document.activeElement).toBe(option("Cherry"));
      expect(prevented).toEqual([true, true, false]);
    });

    it("closes on Escape when the host has no trigger to hand focus back to", async () => {
      // Arrange
      const user = userEvent.setup();
      const errors: unknown[] = [];
      const onError = (event: ErrorEvent) => errors.push(event.error);
      window.addEventListener("error", onError);
      const { host, controller } = connected(true, { extra: { trigger: () => null } });
      controller.sync();

      // Act
      await user.keyboard("{Escape}");
      window.removeEventListener("error", onError);

      // Assert
      expect(errors).toEqual([]);
      expect(host.changes).toEqual([false]);
    });

    it("leaves a key it does not handle alone", async () => {
      // Arrange
      const user = userEvent.setup();
      const { list, host, controller } = connected(true);
      controller.sync();
      let prevented: boolean | undefined;
      list.addEventListener("keydown", (event) => (prevented = event.defaultPrevented));

      // Act
      await user.keyboard("{Shift}");

      // Assert
      expect(prevented).toBe(false);
      expect(host.changes).toEqual([]);
    });
  });

  describe("clicks", () => {
    it("chooses a clicked option, closing and handing focus back to the trigger", async () => {
      // Arrange
      const user = userEvent.setup();
      const { trigger, host, controller } = connected(true);
      controller.sync();

      // Act
      await user.click(option("Cherry"));

      // Assert
      expect(host.selections).toEqual(["cherry"]);
      expect(host.changes).toEqual([false]);
      expect(document.activeElement).toBe(trigger);
    });

    it("ignores a click on a disabled option or on the list outside any option", async () => {
      // Arrange
      const user = userEvent.setup();
      const { list, host, controller } = connected(true);
      controller.sync();

      // Act
      await user.click(option("Banana"));
      await user.click(list);

      // Assert
      expect(host.selections).toEqual([]);
    });
  });

  describe("lifecycle", () => {
    it("stops listening once disconnected, forgets it was shown, and resumes on connect", async () => {
      // Arrange
      const user = userEvent.setup();
      const { list, host, controller } = connected(true);
      controller.sync();
      controller.disconnect();

      // Act
      await user.click(option("Apple"));
      const whileDisconnected = [...host.selections];
      const showPopover = vi.spyOn(list, "showPopover");
      list.hidePopover();
      controller.connect();
      controller.sync();

      // Assert
      expect(whileDisconnected).toEqual([]);
      expect(showPopover).toHaveBeenCalledTimes(1);
    });

    it("stops hearing the browser's dismissal and the keys once disconnected", async () => {
      // Arrange
      const user = userEvent.setup();
      const { list, host, controller } = connected(true, { selected: "apple" });
      controller.sync();
      controller.disconnect();

      // Act
      await user.keyboard("{ArrowDown}");
      list.hidePopover();

      // Assert
      expect(document.activeElement).toBe(option("Apple"));
      expect(host.changes).toEqual([]);
    });

    it("ignores a click before any option is registered", async () => {
      // Arrange
      const user = userEvent.setup();
      const errors: unknown[] = [];
      const onError = (event: ErrorEvent) => errors.push(event.error);
      window.addEventListener("error", onError);
      document.body.innerHTML = '<div id="list" role="listbox" popover="auto"><div role="option">Apple</div></div>';
      const host = hostWith(true, document.createElement("button"));
      const controller = new SelectController(document.getElementById("list") as HTMLElement, host);
      controller.connect();
      controller.sync();

      // Act
      await user.click(option("Apple"));
      window.removeEventListener("error", onError);

      // Assert
      expect(errors).toEqual([]);
      expect(host.selections).toEqual([]);
    });

    it("does not stack a second set of listeners when connected twice", async () => {
      // Arrange
      const user = userEvent.setup();
      const { host, controller } = connected(true);
      controller.connect();
      controller.sync();

      // Act
      await user.click(option("Cherry"));

      // Assert
      expect(host.selections).toEqual(["cherry"]);
    });

    it("can be disconnected before it was ever connected", () => {
      // Arrange
      const list = document.createElement("div");
      const controller = new SelectController(list, hostWith(false, document.createElement("button")));

      // Act & Assert
      expect(() => controller.disconnect()).not.toThrow();
    });
  });
});
