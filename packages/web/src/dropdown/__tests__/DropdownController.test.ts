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
      const { menu, outside, host, controller } = connected(true);
      controller.connect();
      controller.sync();
      await user.click(outside);
      const whileConnected = [...host.changes];

      // Act
      controller.disconnect();
      await user.click(outside);
      menu.hidePopover();
      item("Copy")?.focus();
      await user.keyboard("{ArrowDown}");

      // Assert
      expect(whileConnected).toEqual([false]);
      expect(host.changes).toEqual([false]);
      expect(document.activeElement).toBe(item("Copy"));
    });

    it("disconnects safely before it ever connected", () => {
      // Arrange
      document.body.innerHTML = '<menu id="menu" popover="auto"></menu>';
      const controller = new DropdownController(document.getElementById("menu") as HTMLElement, hostWith(false, document.body));

      // Act & Assert
      expect(() => controller.disconnect()).not.toThrow();
    });

    it("forgets the menu was showing once disconnected, so a reconnect shows it again", () => {
      // Arrange
      const { menu, controller } = connected(true);
      controller.sync();
      const showPopover = vi.spyOn(menu, "showPopover");

      // Act
      controller.disconnect();
      controller.connect();
      controller.sync();

      // Assert
      expect(showPopover).toHaveBeenCalledTimes(1);
    });

    it("shows the menu again when it reopens after closing, before the browser reports the hide", () => {
      // Arrange
      const { menu, host, controller } = connected(true);
      controller.sync();
      const showPopover = vi.spyOn(menu, "showPopover");
      // A browser queues the toggle event; the polyfill would fire it at once.
      vi.spyOn(menu, "hidePopover").mockImplementation(() => menu.removeAttribute("data-popover-open"));
      host.open = false;
      controller.sync();

      // Act
      host.open = true;
      controller.sync();

      // Assert
      expect(showPopover).toHaveBeenCalledTimes(1);
    });

    it("closes on Escape and on a press outside with no trigger to return to", async () => {
      // Arrange
      const user = userEvent.setup();
      const { outside, host, controller } = connected(true, ITEMS, { trigger: () => null });
      controller.sync();
      const errors: unknown[] = [];
      window.addEventListener("error", (event) => errors.push(event.error));

      // Act
      await user.keyboard("{Escape}");
      await user.click(outside);

      // Assert
      expect(host.changes).toEqual([false, false]);
      expect(errors).toEqual([]);
    });
  });

  describe("keyboard", () => {
    /** An open, synced menu with focus on `name`. */
    function focusedOn(name: string, inner = ITEMS) {
      const user = userEvent.setup();
      const parts = connected(true, inner);
      parts.controller.sync();
      item(name)?.focus();
      return { user, ...parts };
    }

    it("moves down and up through the enabled items, wrapping at the ends", async () => {
      // Arrange
      const { user } = focusedOn("Copy");

      // Act
      await user.keyboard("{ArrowDown}");
      const afterDown = document.activeElement;
      await user.keyboard("{ArrowDown}{ArrowDown}");
      const afterWrap = document.activeElement;
      await user.keyboard("{ArrowUp}");

      // Assert
      expect(afterDown).toBe(item("Paste"));
      expect(afterWrap).toBe(item("Copy"));
      expect(document.activeElement).toBe(item("Print"));
    });

    it("jumps to the last item on End and the first on Home", async () => {
      // Arrange
      const { user } = focusedOn("Copy");

      // Act
      await user.keyboard("{End}");
      const afterEnd = document.activeElement;
      await user.keyboard("{Home}");

      // Assert
      expect(afterEnd).toBe(item("Print"));
      expect(document.activeElement).toBe(item("Copy"));
    });

    it.each(["{Enter}", " "])("activates the focused item on %j", async (key) => {
      // Arrange
      const { user } = focusedOn("Paste");
      const clicked = vi.fn();
      item("Paste")?.addEventListener("click", clicked);

      // Act
      await user.keyboard(key);

      // Assert
      expect(clicked).toHaveBeenCalledTimes(1);
    });

    it("closes on Escape and hands focus back to the trigger", async () => {
      // Arrange
      const { user, host, trigger } = focusedOn("Paste");

      // Act
      await user.keyboard("{Escape}");

      // Assert
      expect(host.changes).toEqual([false]);
      expect(document.activeElement).toBe(trigger);
    });

    it("leaves other keys alone", async () => {
      // Arrange
      const { user } = focusedOn("Copy");
      const seen: boolean[] = [];
      document.addEventListener("keydown", (event) => seen.push(event.defaultPrevented));

      // Act
      await user.keyboard("{ArrowRight}{Tab}");

      // Assert
      expect(seen).toEqual([false, false]);
    });

    it("moves only among the items of the menu holding focus, a submenu's own or the parent's", async () => {
      // Arrange
      const nested =
        '<li role="menuitem" tabindex="-1">Copy</li><li role="menuitem" tabindex="-1">Share</li>' +
        '<menu id="sub" role="menu" popover="auto"><li role="menuitem" tabindex="-1">Email</li><li role="menuitem" tabindex="-1">Link</li></menu>' +
        '<li role="menuitem" tabindex="-1">Delete</li>';
      const { user } = focusedOn("Share", nested);
      await user.keyboard("{ArrowDown}");
      const inParent = document.activeElement;
      (document.getElementById("sub") as HTMLElement).showPopover();
      item("Link")?.focus();

      // Act
      await user.keyboard("{ArrowDown}");

      // Assert
      expect(inParent).toBe(item("Delete"));
      expect(document.activeElement).toBe(item("Email"));
    });

    it("searches this menu for a key a script dispatches on it while focus is outside", () => {
      // Arrange
      const { menu, trigger, controller } = connected(true);
      controller.sync();
      trigger.focus();

      // Act — a script, not the user: no input device can send a key to an element without focus.
      menu.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));

      // Assert
      expect(document.activeElement).toBe(item("Print"));
    });

    it("does nothing in a menu with no enabled items", async () => {
      // Arrange
      const { user, menu, host } = focusedOn("Off", '<li role="menuitem" tabindex="-1" aria-disabled="true">Off</li>');
      menu.focus();

      // Act
      await user.keyboard("{ArrowDown}{Escape}");

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("focuses the item the typed letters start, and starts afresh after a pause", async () => {
      // Arrange
      const { user } = focusedOn("Copy");

      // Act
      await user.keyboard("pr");
      const typed = document.activeElement;
      await new Promise((resolve) => setTimeout(resolve, 600));
      await user.keyboard("c");

      // Assert
      expect(typed).toBe(item("Print"));
      expect(document.activeElement).toBe(item("Copy"));
    });

    it("keeps typing as one query within the pause", async () => {
      // Arrange
      const { user } = focusedOn("Copy");

      // Act
      await user.keyboard("p");
      await new Promise((resolve) => setTimeout(resolve, 300));
      await user.keyboard("r");

      // Assert
      expect(document.activeElement).toBe(item("Print"));
    });

    it("leaves a typed letter that matches nothing alone", async () => {
      // Arrange
      const { user } = focusedOn("Copy");
      const seen: boolean[] = [];
      document.addEventListener("keydown", (event) => seen.push(event.defaultPrevented));

      // Act
      await user.keyboard("z");

      // Assert
      expect(seen).toEqual([false]);
      expect(document.activeElement).toBe(item("Copy"));
    });
  });
});
