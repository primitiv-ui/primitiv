/**
 * The Context Menu behaviour every Primitiv surface must share, written against the
 * DOM alone: Testing Library role queries and real keyboard and pointer input,
 * never a surface's own API. Each surface runs it with its own `mount`, so a
 * behaviour one surface has and the other lacks fails here (RFC 0033 §6.2,
 * D12).
 *
 * jsdom has no Popover API, so each surface loads its own scoped polyfill
 * before running this, and the outside-press fallback stands in for the
 * browser's light dismiss. jsdom cannot tell an open popover is visible, so
 * queries inside a menu pass `hidden: true`. What a surface does *differently
 * on purpose* — React's `asChild`, callbacks and inline position, the
 * elements' reflected attributes, events and position properties — belongs in
 * that surface's own suite.
 */
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

/** The text every fixture renders. */
export const CONTEXT_MENU = {
  region: "Right-click here",
  copy: "Copy",
  cut: "Cut",
  grid: "Show grid",
  small: "Small",
  large: "Large",
  share: "Share",
  email: "Email",
  link: "Link",
  remove: "Delete",
  outside: "Outside",
} as const;

/** Pure data describing one dropdown; each surface turns it into its own markup. */
export type ContextMenuConformanceFixture = {
  /** Whether it starts open. */
  open?: boolean;
  /** Whether the trigger region is disabled. */
  disabled?: boolean;
};

/**
 * Render `fixture` into `document.body` and resolve once it has settled, to a
 * cleanup. In order, a trigger region holding the text {@link CONTEXT_MENU}`.region`
 * (disabled when the fixture says), opening a menu of: an item `copy`; a disabled item `cut`; an unchecked checkbox item
 * `grid`; a radio group holding `small` (checked) and `large`; a sub-trigger
 * `share` opening a submenu of `email` and `link`; and an item `remove`. Then a
 * button outside it labelled `outside`.
 */
export type ContextMenuMount = (fixture: ContextMenuConformanceFixture) => Promise<() => void>;

const region = () => screen.getByText(CONTEXT_MENU.region);
const menuitem = (role: "menuitem" | "menuitemcheckbox" | "menuitemradio", name: string) =>
  screen.getByRole(role, { name, hidden: true });
const item = (name: string) => menuitem("menuitem", name);
const menu = () => item(CONTEXT_MENU.copy).closest('[role="menu"]') as HTMLElement;
const isOpen = () => menu().getAttribute("data-state") === "open";
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

export function runContextMenuConformance(mount: ContextMenuMount): void {
  let cleanup: (() => void) | undefined;

  const render = async (fixture: ContextMenuConformanceFixture) => {
    cleanup = await mount(fixture);
  };

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  describe("Context Menu conformance", () => {
    describe("structure", () => {
      it("is closed, with its menu hidden until the region is right-clicked", async () => {
        // Arrange & Act
        await render({});

        // Assert
        expect(menu().getAttribute("role")).toBe("menu");
        expect(isOpen()).toBe(false);
      });

      it("gives each item its role, and marks the disabled one", async () => {
        // Arrange & Act
        await render({});

        // Assert
        expect(item(CONTEXT_MENU.cut).getAttribute("aria-disabled")).toBe("true");
        expect(menuitem("menuitemcheckbox", CONTEXT_MENU.grid).getAttribute("aria-checked")).toBe("false");
        expect(menuitem("menuitemradio", CONTEXT_MENU.small).getAttribute("aria-checked")).toBe("true");
        expect(menuitem("menuitemradio", CONTEXT_MENU.large).getAttribute("aria-checked")).toBe("false");
        expect(item(CONTEXT_MENU.share).getAttribute("aria-haspopup")).toBe("menu");
        expect(item(CONTEXT_MENU.share).getAttribute("aria-expanded")).toBe("false");
      });
    });

    describe("opening and closing", () => {
      it("opens on a right-click in the region, with focus on the first item", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});

        // Act
        await user.pointer({ keys: "[MouseRight]", target: region() });
        await settle();

        // Assert
        expect(isOpen()).toBe(true);
        expect(document.activeElement).toBe(item(CONTEXT_MENU.copy));
      });

      it("stays closed on a right-click in a disabled region", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ disabled: true });

        // Act
        await user.pointer({ keys: "[MouseRight]", target: region() });
        await settle();

        // Assert
        expect(isOpen()).toBe(false);
      });

      it("closes on Escape", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        await user.pointer({ keys: "[MouseRight]", target: region() });
        await settle();

        // Act
        await user.keyboard("{Escape}");
        await settle();

        // Assert
        expect(isOpen()).toBe(false);
      });

      it("closes on a press outside", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ open: true });

        // Act
        await user.click(screen.getByRole("button", { name: CONTEXT_MENU.outside }));
        await settle();

        // Assert
        expect(isOpen()).toBe(false);
      });
    });

    describe("keyboard", () => {
      it("moves through the enabled items, skipping the disabled one and wrapping", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        await user.pointer({ keys: "[MouseRight]", target: region() });
        await settle();

        // Act
        await user.keyboard("{ArrowDown}");
        const next = document.activeElement;
        await user.keyboard("{End}");
        const last = document.activeElement;
        await user.keyboard("{ArrowDown}");

        // Assert
        expect(next).toBe(menuitem("menuitemcheckbox", CONTEXT_MENU.grid));
        expect(last).toBe(item(CONTEXT_MENU.remove));
        expect(document.activeElement).toBe(item(CONTEXT_MENU.copy));
      });

      it("focuses the item typed letters start", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        await user.pointer({ keys: "[MouseRight]", target: region() });
        await settle();

        // Act
        await user.keyboard("d");

        // Assert
        expect(document.activeElement).toBe(item(CONTEXT_MENU.remove));
      });

      it("chooses the focused item on Enter, closing the menu", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        await user.pointer({ keys: "[MouseRight]", target: region() });
        await settle();

        // Act
        await user.keyboard("{Enter}");
        await settle();

        // Assert
        expect(isOpen()).toBe(false);
      });
    });

    describe("items", () => {
      it("does nothing when a disabled item is clicked", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        await user.pointer({ keys: "[MouseRight]", target: region() });
        await settle();

        // Act
        await user.click(item(CONTEXT_MENU.cut));
        await settle();

        // Assert
        expect(isOpen()).toBe(true);
      });

      it("toggles a checkbox item, closing the menu", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        await user.pointer({ keys: "[MouseRight]", target: region() });
        await settle();

        // Act
        await user.click(menuitem("menuitemcheckbox", CONTEXT_MENU.grid));
        await settle();

        // Assert
        expect(isOpen()).toBe(false);
        expect(menuitem("menuitemcheckbox", CONTEXT_MENU.grid).getAttribute("aria-checked")).toBe("true");
      });

      it("checks a radio item and unchecks the rest of its group", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        await user.pointer({ keys: "[MouseRight]", target: region() });
        await settle();

        // Act
        await user.click(menuitem("menuitemradio", CONTEXT_MENU.large));
        await settle();

        // Assert
        expect(menuitem("menuitemradio", CONTEXT_MENU.large).getAttribute("aria-checked")).toBe("true");
        expect(menuitem("menuitemradio", CONTEXT_MENU.small).getAttribute("aria-checked")).toBe("false");
      });
    });

    describe("submenu", () => {
      it("opens on the arrow away from its parent and closes on the arrow back, focus following", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        await user.pointer({ keys: "[MouseRight]", target: region() });
        await settle();
        await user.keyboard("{End}{ArrowUp}");

        // Act
        await user.keyboard("{ArrowRight}");
        await settle();
        const opened = item(CONTEXT_MENU.share).getAttribute("aria-expanded");
        const inside = document.activeElement;
        await user.keyboard("{ArrowLeft}");
        await settle();

        // Assert
        expect(opened).toBe("true");
        expect(inside).toBe(item(CONTEXT_MENU.email));
        expect(item(CONTEXT_MENU.share).getAttribute("aria-expanded")).toBe("false");
        expect(document.activeElement).toBe(item(CONTEXT_MENU.share));
        expect(isOpen()).toBe(true);
      });

      it("opens on a click, and choosing an item in it closes the whole menu", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        await user.pointer({ keys: "[MouseRight]", target: region() });
        await settle();

        // Act
        await user.click(item(CONTEXT_MENU.share));
        await settle();
        const opened = item(CONTEXT_MENU.share).getAttribute("aria-expanded");
        await user.click(item(CONTEXT_MENU.link));
        await settle();

        // Assert
        expect(opened).toBe("true");
        expect(isOpen()).toBe(false);
        expect(item(CONTEXT_MENU.share).getAttribute("aria-expanded")).toBe("false");
      });
    });
  });
}
