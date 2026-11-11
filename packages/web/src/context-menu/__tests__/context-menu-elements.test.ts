import userEvent from "@testing-library/user-event";

import { defineContextMenu, PrimitivContextMenuElement, type ElementRegistry } from "../elements";
import { contextMenuHtml, LABELS } from "./context-menu.fixtures";
import { content, listenerErrors, mount, region, root, row, settle, shown, sub, subContent } from "./mount";

afterEach(() => {
  document.body.replaceChildren();
  expect(listenerErrors.splice(0)).toEqual([]);
});

const ELEMENTS = [
  "primitiv-context-menu",
  "primitiv-context-menu-trigger",
  "primitiv-context-menu-content",
  "primitiv-context-menu-item",
  "primitiv-context-menu-checkbox-item",
  "primitiv-context-menu-radio-group",
  "primitiv-context-menu-radio-item",
  "primitiv-context-menu-item-indicator",
  "primitiv-context-menu-group",
  "primitiv-context-menu-label",
  "primitiv-context-menu-separator",
  "primitiv-context-menu-sub",
  "primitiv-context-menu-sub-trigger",
  "primitiv-context-menu-sub-content",
];

/** A right-click at a point inside `target`. */
const rightClick = (target: Element, clientX = 40, clientY = 60) =>
  userEvent.setup().pointer({ keys: "[MouseRight]", target, coords: { clientX, clientY } });

describe("<primitiv-context-menu>", () => {
  it("defines exactly the fourteen tag names on the registry it is given, skipping any already there", () => {
    // Arrange
    const defined: string[] = [];
    const registry: ElementRegistry = {
      get: (name: string) => (name === "primitiv-context-menu-label" ? class {} : undefined) as never,
      define: (name: string) => {
        defined.push(name);
      },
    };

    // Act
    defineContextMenu(registry);

    // Assert
    expect(defined).toEqual(ELEMENTS.filter((name) => name !== "primitiv-context-menu-label"));
  });

  it("makes the menu a manual popover reporting data-state, and marks an enabled region closed", async () => {
    // Arrange & Act
    await mount(contextMenuHtml({ id: "files" }).replace(' popover="manual"', ""));

    // Assert
    expect(content().getAttribute("popover")).toBe("manual");
    expect(content().getAttribute("data-state")).toBe("closed");
    expect(content().id).toBe("files-content");
    expect(region().getAttribute("data-state")).toBe("closed");
    expect(region().hasAttribute("data-disabled")).toBe(false);
  });

  it("marks a disabled region, with no state, and follows the attribute", async () => {
    // Arrange
    await mount(contextMenuHtml({ disabled: true }));
    const disabled = [region().getAttribute("data-disabled"), region().hasAttribute("data-state")];

    // Act
    region().removeAttribute("disabled");
    await settle();

    // Assert
    expect(disabled).toEqual(["", false]);
    expect(region().hasAttribute("data-disabled")).toBe(false);
    expect(region().getAttribute("data-state")).toBe("closed");
  });

  it("opens at the pointer, publishing its position for the stylesheet, and keeps the browser's own menu shut", async () => {
    // Arrange
    await mount(contextMenuHtml());
    let defaultPrevented = false;
    document.addEventListener("contextmenu", (event) => (defaultPrevented = event.defaultPrevented), { once: true });

    // Act
    await rightClick(region(), 40, 60);
    await settle();

    // Assert
    expect(root().open).toBe(true);
    expect(shown()).toBe(true);
    expect(content().getAttribute("data-state")).toBe("open");
    expect(content().style.getPropertyValue("--primitiv-context-menu-x")).toBe("40px");
    expect(content().style.getPropertyValue("--primitiv-context-menu-y")).toBe("60px");
    expect(defaultPrevented).toBe(true);
  });

  it("moves to a second right-click while open", async () => {
    // Arrange
    await mount(contextMenuHtml());
    await rightClick(region(), 40, 60);
    await settle();

    // Act
    await rightClick(region(), 90, 120);
    await settle();

    // Assert
    expect(root().open).toBe(true);
    expect(content().style.getPropertyValue("--primitiv-context-menu-x")).toBe("90px");
  });

  it("leaves a right-click outside the region, or in a disabled one, to the browser", async () => {
    // Arrange
    await mount(contextMenuHtml({ disabled: true }));
    const prevented: boolean[] = [];
    document.addEventListener("contextmenu", (event) => prevented.push(event.defaultPrevented));

    // Act
    await rightClick(region());
    await rightClick(document.querySelector("primitiv-context-menu-separator") as HTMLElement);
    await settle();

    // Assert
    expect(prevented).toEqual([false, false]);
    expect(root().open).toBe(false);
  });

  it("closes an open submenu as the menu closes", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(contextMenuHtml());
    await rightClick(region());
    await settle();
    await user.click(row(LABELS.share));
    await settle();
    const opened = sub().open;

    // Act
    await user.keyboard("{Escape}");
    await settle();

    // Assert
    expect(opened).toBe(true);
    expect(root().open).toBe(false);
    expect(sub().open).toBe(false);
    expect(shown(subContent())).toBe(false);
  });

  it("opens a submenu the server rendered open inside an open menu", async () => {
    // Arrange & Act
    await mount(contextMenuHtml({ open: true, subOpen: true }));

    // Assert
    expect(sub().open).toBe(true);
    expect(row(LABELS.share).getAttribute("aria-expanded")).toBe("true");
  });

  it("works with no trigger region, from its open attribute alone", async () => {
    // Arrange
    await mount(contextMenuHtml().replace(/<primitiv-context-menu-trigger>.*?<\/primitiv-context-menu-trigger>/, ""));

    // Act
    root().open = true;
    await settle();
    await rightClick(row(LABELS.copy));

    // Assert
    expect(shown()).toBe(true);
    expect(listenerErrors).toEqual([]);
  });

  it("opens with no menu to place", async () => {
    // Arrange
    await mount(contextMenuHtml().replace(/<primitiv-context-menu-content.*<\/primitiv-context-menu-content>/, ""));

    // Act
    await rightClick(region());
    await settle();

    // Assert
    expect(root().open).toBe(true);
    expect(listenerErrors).toEqual([]);
  });

  it("keeps a popover mode the markup gives its menu", async () => {
    // Arrange & Act
    await mount(contextMenuHtml().replace('<primitiv-context-menu-content popover="manual">', '<primitiv-context-menu-content popover="auto">'));

    // Assert
    expect(content().getAttribute("popover")).toBe("auto");
  });

  it("listens once when it is removed and put back", async () => {
    // Arrange
    await mount(contextMenuHtml());
    const element = root();
    element.remove();
    document.body.append(element);
    await settle();
    const changes: unknown[] = [];
    document.addEventListener("primitiv-context-menu-change", (event) => {
      changes.push((event as CustomEvent).detail);
      event.preventDefault();
    });

    // Act
    await rightClick(region());
    await settle();

    // Assert
    expect(changes).toEqual([{ open: true }]);
  });
});

describe("<primitiv-context-menu> on the server", () => {
  it("is a class even before it is defined", () => {
    // Arrange & Act & Assert
    expect(PrimitivContextMenuElement).toBeDefined();
  });
});
