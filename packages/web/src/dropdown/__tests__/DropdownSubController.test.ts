import "./popover-polyfill";

import userEvent from "@testing-library/user-event";

import { DropdownSubController, type DropdownSubControllerHost } from "../DropdownSubController";

type Recorded = DropdownSubControllerHost & { changes: boolean[]; open: boolean };

const ITEMS =
  '<li role="menuitem" tabindex="-1" aria-disabled="true">Off</li><li role="menuitem" tabindex="-1">Email</li>' +
  '<li role="menuitem" tabindex="-1">Link</li>';

/** A parent menu holding a sub-trigger and a connected controller over its submenu. */
function connected(open = false, extra: Partial<DropdownSubControllerHost> = {}) {
  document.body.innerHTML =
    '<menu id="parent" role="menu"><li id="trigger" role="menuitem" tabindex="-1">Share</li>' +
    `<menu id="sub" role="menu" popover="auto">${ITEMS}</menu></menu>`;
  const trigger = document.getElementById("trigger") as HTMLElement;
  const menu = document.getElementById("sub") as HTMLElement;
  const host: Recorded = {
    open,
    changes: [],
    state: () => ({ open: host.open }),
    change(next) {
      host.changes.push(next);
    },
    trigger: () => trigger,
    closeKey: () => "ArrowLeft",
    ...extra,
  };
  const controller = new DropdownSubController(menu, host);
  controller.connect();
  return { trigger, menu, host, controller, parent: document.getElementById("parent") as HTMLElement };
}

const shown = (menu: HTMLElement) => menu.hasAttribute("data-popover-open");
const item = (name: string) => [...document.querySelectorAll<HTMLElement>("li")].find((li) => li.textContent === name);

afterEach(() => {
  document.body.replaceChildren();
});

describe("DropdownSubController", () => {
  it("shows the submenu with its trigger as the anchor and focuses its first enabled item", () => {
    // Arrange
    const { menu, trigger, controller } = connected(true, { source: () => trigger });
    const showPopover = vi.spyOn(menu, "showPopover");
    trigger.focus();

    // Act
    controller.sync();

    // Assert
    expect(showPopover).toHaveBeenCalledWith({ source: trigger });
    expect(shown(menu)).toBe(true);
    expect(document.activeElement).toBe(item("Email"));
  });

  it("passes no options without an anchor, and shows it only once while open", () => {
    // Arrange
    const { menu, controller } = connected(true);
    const showPopover = vi.spyOn(menu, "showPopover");

    // Act
    controller.sync();
    controller.sync();

    // Assert
    expect(showPopover).toHaveBeenCalledTimes(1);
    expect(showPopover).toHaveBeenCalledWith();
  });

  it("hides the submenu once the host closes it, and hides nothing it did not show", () => {
    // Arrange
    const { menu, host, controller } = connected(true);
    controller.sync();
    const hidePopover = vi.spyOn(menu, "hidePopover");

    // Act
    host.open = false;
    controller.sync();
    controller.sync();

    // Assert
    expect(hidePopover).toHaveBeenCalledTimes(1);
    expect(shown(menu)).toBe(false);
  });

  it("survives a submenu that is no longer a popover when it hides", () => {
    // Arrange
    const { menu, host, controller } = connected(true);
    controller.sync();
    vi.spyOn(menu, "hidePopover").mockImplementation(() => {
      throw new DOMException("not a popover", "NotSupportedError");
    });
    host.open = false;

    // Act & Assert
    expect(() => controller.sync()).not.toThrow();
  });

  it("reports the browser hiding it, and shows it again on the next sync", () => {
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

  it("closes on its close key, hands focus back to its trigger, and keeps the key from the parent menu", async () => {
    // Arrange
    const user = userEvent.setup();
    const { host, trigger, parent, controller } = connected(true);
    controller.sync();
    const parentSaw = vi.fn();
    parent.addEventListener("keydown", parentSaw);

    // Act
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(host.changes).toEqual([false]);
    expect(document.activeElement).toBe(trigger);
    expect(parentSaw).not.toHaveBeenCalled();
  });

  it("uses the close key the host gives, for a right-to-left menu", async () => {
    // Arrange
    const user = userEvent.setup();
    const { host, controller } = connected(true, { closeKey: () => "ArrowRight" });
    controller.sync();

    // Act
    await user.keyboard("{ArrowLeft}");
    const afterOther = [...host.changes];
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(afterOther).toEqual([]);
    expect(host.changes).toEqual([false]);
  });

  it("lets every other key reach the parent menu", async () => {
    // Arrange
    const user = userEvent.setup();
    const { parent, controller } = connected(true);
    controller.sync();
    const parentSaw: boolean[] = [];
    parent.addEventListener("keydown", (event) => parentSaw.push(event.defaultPrevented));

    // Act
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(parentSaw).toEqual([false]);
  });

  it("stops listening once disconnected, and connects only once", async () => {
    // Arrange
    const user = userEvent.setup();
    const { host, controller } = connected(true);
    controller.connect();
    controller.sync();
    await user.keyboard("{ArrowLeft}");
    const whileConnected = [...host.changes];
    controller.disconnect();
    controller.sync();
    (document.querySelector("#sub li:nth-child(2)") as HTMLElement).focus();

    // Act
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(whileConnected).toEqual([false]);
    expect(host.changes).toEqual([false]);
  });
});
