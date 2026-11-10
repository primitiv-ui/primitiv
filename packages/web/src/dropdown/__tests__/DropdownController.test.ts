import "./popover-polyfill";

import userEvent from "@testing-library/user-event";

import { DropdownController, type DropdownControllerHost } from "../DropdownController";

type Recorded = DropdownControllerHost & { changes: boolean[]; open: boolean };

/** A host that starts `open`, records every change, and owns `trigger`. */
function hostWith(open: boolean, trigger: HTMLElement, extra: Partial<DropdownControllerHost> = {}): Recorded {
  const host: Recorded = {
    open,
    changes: [],
    state: () => ({ open: host.open }),
    change(next) {
      host.changes.push(next);
    },
    trigger: () => trigger,
    ...extra,
  };
  return host;
}

const ITEMS =
  '<li role="menuitem" tabindex="-1">Copy</li><li role="menuitem" tabindex="-1" aria-disabled="true">Cut</li>' +
  '<li role="menuitemcheckbox" tabindex="-1">Paste</li><li role="menuitemradio" tabindex="-1">Print</li>';

/** A trigger, an outside button and a connected controller over a menu holding `inner`. */
function connected(open = false, inner = ITEMS, extra: Partial<DropdownControllerHost> = {}) {
  document.body.innerHTML = `<button id="trigger">Open</button><button id="outside">Outside</button><menu id="menu" role="menu" popover="auto">${inner}</menu>`;
  const trigger = document.getElementById("trigger") as HTMLButtonElement;
  const menu = document.getElementById("menu") as HTMLElement;
  const host = hostWith(open, trigger, extra);
  const controller = new DropdownController(menu, host);
  controller.connect();
  return { trigger, menu, host, controller, outside: document.getElementById("outside") as HTMLButtonElement };
}

const shown = (menu: HTMLElement) => menu.hasAttribute("data-popover-open");
const item = (name: string) => [...document.querySelectorAll<HTMLElement>("li")].find((li) => li.textContent === name);

afterEach(() => {
  document.body.replaceChildren();
});

describe("DropdownController", () => {
  describe("sync", () => {
    it("shows the menu and moves focus to its first enabled item when the host is open", () => {
      // Arrange
      const { menu, controller } = connected(true, '<li role="menuitem" aria-disabled="true">Off</li>' + ITEMS);

      // Act
      controller.sync();

      // Assert
      expect(shown(menu)).toBe(true);
      expect(document.activeElement).toBe(item("Copy"));
    });

    it("leaves focus where it is when it is already inside the menu", () => {
      // Arrange
      const { controller } = connected(true);
      item("Paste")?.focus();

      // Act
      controller.sync();

      // Assert
      expect(document.activeElement).toBe(item("Paste"));
    });

    it("hands the browser the anchor to position against", () => {
      // Arrange
      const anchor = document.createElement("span");
      const { menu, controller } = connected(true, ITEMS, { source: () => anchor });
      const showPopover = vi.spyOn(menu, "showPopover");

      // Act
      controller.sync();

      // Assert
      expect(showPopover).toHaveBeenCalledWith({ source: anchor });
    });

    it("passes no options without an anchor", () => {
      // Arrange
      const { menu, controller } = connected(true);
      const showPopover = vi.spyOn(menu, "showPopover");

      // Act
      controller.sync();

      // Assert
      expect(showPopover).toHaveBeenCalledWith();
    });

    it("shows a menu with no items without moving focus", () => {
      // Arrange
      const { menu, trigger, controller } = connected(true, "<li>Nothing to pick</li>");
      trigger.focus();

      // Act
      controller.sync();

      // Assert
      expect(shown(menu)).toBe(true);
      expect(document.activeElement).toBe(trigger);
    });

    it("hides the menu once the host closes, and shows it only once while open", () => {
      // Arrange
      const { menu, host, controller } = connected(true);
      const showPopover = vi.spyOn(menu, "showPopover");
      controller.sync();
      controller.sync();

      // Act
      host.open = false;
      controller.sync();

      // Assert
      expect(showPopover).toHaveBeenCalledTimes(1);
      expect(shown(menu)).toBe(false);
    });

    it("hides nothing it did not show", () => {
      // Arrange
      const { menu, controller } = connected(false);
      const hidePopover = vi.spyOn(menu, "hidePopover");

      // Act
      controller.sync();

      // Assert
      expect(hidePopover).not.toHaveBeenCalled();
    });

    it("survives a menu that is no longer a popover when it hides", () => {
      // Arrange
      const { menu, host, controller } = connected(true);
      controller.sync();
      vi.spyOn(menu, "hidePopover").mockImplementation(() => {
        throw new DOMException("not a popover", "NotSupportedError");
      });

      // Act
      host.open = false;
      controller.sync();

      // Assert
      expect(() => controller.sync()).not.toThrow();
    });
  });

  describe("dismissal", () => {
    it("reports the browser hiding the menu, and shows it again on the next sync", () => {
      // Arrange
      const { menu, host, controller } = connected(true);
      controller.sync();

      // Act
      menu.hidePopover();
      controller.sync();

      // Assert
      expect(host.changes).toEqual([false]);
      expect(shown(menu)).toBe(true);
    });

    it("closes on a press outside, and not on the trigger or inside a popover", async () => {
      // Arrange
      const user = userEvent.setup();
      const { trigger, outside, host, controller } = connected(true);
      controller.sync();

      // Act
      await user.click(trigger);
      await user.click(item("Copy") as HTMLElement);
      const before = [...host.changes];
      await user.click(outside);

      // Assert
      expect(before).toEqual([]);
      expect(host.changes).toEqual([false]);
    });

    it("ignores a press while closed", async () => {
      // Arrange
      const user = userEvent.setup();
      const { outside, host } = connected(false);

      // Act
      await user.click(outside);

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("stops listening once disconnected, and connects only once", async () => {
      // Arrange
      const user = userEvent.setup();
      const { outside, host, controller } = connected(true);
      controller.connect();
      await user.click(outside);
      const whileConnected = [...host.changes];

      // Act
      controller.disconnect();
      await user.click(outside);

      // Assert
      expect(whileConnected).toEqual([false]);
      expect(host.changes).toEqual([false]);
    });
  });
});
