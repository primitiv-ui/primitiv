/**
 * The Dropdown behaviour every Primitiv surface must share, written against the
 * DOM alone: Testing Library role queries and real keyboard and pointer input,
 * never a surface's own API. Each surface runs it with its own `mount`, so a
 * behaviour one surface has and the other lacks fails here (RFC 0033 §6.2,
 * D12).
 *
 * jsdom has no Popover API, so each surface loads its own scoped polyfill
 * before running this, and the outside-press fallback stands in for the
 * browser's light dismiss. jsdom cannot tell an open popover is visible, so
 * queries inside a menu pass `hidden: true`. What a surface does *differently
 * on purpose* — React's `asChild`, callbacks and anchor wiring, the elements'
 * reflected attributes, events and implicit anchor — belongs in that surface's
 * own suite.
 */
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

/** The text every fixture renders. */
export const DROPDOWN = {
  trigger: "Options",
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
export type DropdownConformanceFixture = {
  /** Whether it starts open. */
  open?: boolean;
};

/**
 * Render `fixture` into `document.body` and resolve once it has settled, to a
 * cleanup. In order, a trigger labelled {@link DROPDOWN}`.trigger` opening a
 * menu of: an item `copy`; a disabled item `cut`; an unchecked checkbox item
 * `grid`; a radio group holding `small` (checked) and `large`; a sub-trigger
 * `share` opening a submenu of `email` and `link`; and an item `remove`. Then a
 * button outside it labelled `outside`.
 */
export type DropdownMount = (fixture: DropdownConformanceFixture) => Promise<() => void>;

const trigger = () => screen.getByRole("button", { name: DROPDOWN.trigger });
const menuitem = (role: "menuitem" | "menuitemcheckbox" | "menuitemradio", name: string) =>
  screen.getByRole(role, { name, hidden: true });
const item = (name: string) => menuitem("menuitem", name);
const isOpen = () => trigger().getAttribute("aria-expanded") === "true";
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

export function runDropdownConformance(mount: DropdownMount): void {
  let cleanup: (() => void) | undefined;

  const render = async (fixture: DropdownConformanceFixture) => {
    cleanup = await mount(fixture);
  };

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  describe("Dropdown conformance", () => {
    describe("structure", () => {
      it("is a menu button, closed, controlling a menu", async () => {
        // Arrange & Act
        await render({});

        // Assert
        expect(trigger().getAttribute("aria-haspopup")).toBe("menu");
        expect(isOpen()).toBe(false);
        const menu = document.getElementById(trigger().getAttribute("aria-controls") ?? "");
        expect(menu?.getAttribute("role")).toBe("menu");
      });

      it("gives each item its role, and marks the disabled one", async () => {
        // Arrange & Act
        await render({});

        // Assert
        expect(item(DROPDOWN.cut).getAttribute("aria-disabled")).toBe("true");
        expect(menuitem("menuitemcheckbox", DROPDOWN.grid).getAttribute("aria-checked")).toBe("false");
        expect(menuitem("menuitemradio", DROPDOWN.small).getAttribute("aria-checked")).toBe("true");
        expect(menuitem("menuitemradio", DROPDOWN.large).getAttribute("aria-checked")).toBe("false");
        expect(item(DROPDOWN.share).getAttribute("aria-haspopup")).toBe("menu");
        expect(item(DROPDOWN.share).getAttribute("aria-expanded")).toBe("false");
      });
    });

    describe("opening and closing", () => {
      it("opens on a click with focus on the first item, and the trigger toggles it closed", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});

        // Act
        await user.click(trigger());
        await settle();
        const opened = isOpen();
        const focused = document.activeElement;
        await user.click(trigger());
        await settle();

        // Assert
        expect(opened).toBe(true);
        expect(focused).toBe(item(DROPDOWN.copy));
        expect(isOpen()).toBe(false);
      });

      it("closes on Escape and hands focus back to the trigger", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        await user.click(trigger());
        await settle();

        // Act
        await user.keyboard("{Escape}");
        await settle();

        // Assert
        expect(isOpen()).toBe(false);
        expect(document.activeElement).toBe(trigger());
      });

      it("closes on a press outside", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ open: true });

        // Act
        await user.click(screen.getByRole("button", { name: DROPDOWN.outside }));
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
        await user.click(trigger());
        await settle();

        // Act
        await user.keyboard("{ArrowDown}");
        const next = document.activeElement;
        await user.keyboard("{End}");
        const last = document.activeElement;
        await user.keyboard("{ArrowDown}");

        // Assert
        expect(next).toBe(menuitem("menuitemcheckbox", DROPDOWN.grid));
        expect(last).toBe(item(DROPDOWN.remove));
        expect(document.activeElement).toBe(item(DROPDOWN.copy));
      });

      it("focuses the item typed letters start", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        await user.click(trigger());
        await settle();

        // Act
        await user.keyboard("d");

        // Assert
        expect(document.activeElement).toBe(item(DROPDOWN.remove));
      });

      it("chooses the focused item on Enter, closing the menu with focus back on the trigger", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        await user.click(trigger());
        await settle();

        // Act
        await user.keyboard("{Enter}");
        await settle();

        // Assert
        expect(isOpen()).toBe(false);
        expect(document.activeElement).toBe(trigger());
      });
    });

    describe("items", () => {
      it("does nothing when a disabled item is clicked", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        await user.click(trigger());
        await settle();

        // Act
        await user.click(item(DROPDOWN.cut));
        await settle();

        // Assert
        expect(isOpen()).toBe(true);
      });

      it("toggles a checkbox item, closing the menu", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        await user.click(trigger());
        await settle();

        // Act
        await user.click(menuitem("menuitemcheckbox", DROPDOWN.grid));
        await settle();

        // Assert
        expect(isOpen()).toBe(false);
        expect(menuitem("menuitemcheckbox", DROPDOWN.grid).getAttribute("aria-checked")).toBe("true");
      });

      it("checks a radio item and unchecks the rest of its group", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        await user.click(trigger());
        await settle();

        // Act
        await user.click(menuitem("menuitemradio", DROPDOWN.large));
        await settle();

        // Assert
        expect(menuitem("menuitemradio", DROPDOWN.large).getAttribute("aria-checked")).toBe("true");
        expect(menuitem("menuitemradio", DROPDOWN.small).getAttribute("aria-checked")).toBe("false");
      });
    });

    describe("submenu", () => {
      it("opens on the arrow away from its parent and closes on the arrow back, focus following", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        await user.click(trigger());
        await settle();
        await user.keyboard("{End}{ArrowUp}");

        // Act
        await user.keyboard("{ArrowRight}");
        await settle();
        const opened = item(DROPDOWN.share).getAttribute("aria-expanded");
        const inside = document.activeElement;
        await user.keyboard("{ArrowLeft}");
        await settle();

        // Assert
        expect(opened).toBe("true");
        expect(inside).toBe(item(DROPDOWN.email));
        expect(item(DROPDOWN.share).getAttribute("aria-expanded")).toBe("false");
        expect(document.activeElement).toBe(item(DROPDOWN.share));
        expect(isOpen()).toBe(true);
      });

      it("opens on a click, and choosing an item in it closes the whole menu", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        await user.click(trigger());
        await settle();

        // Act
        await user.click(item(DROPDOWN.share));
        await settle();
        const opened = item(DROPDOWN.share).getAttribute("aria-expanded");
        await user.click(item(DROPDOWN.link));
        await settle();

        // Assert
        expect(opened).toBe("true");
        expect(isOpen()).toBe(false);
        expect(document.activeElement).toBe(trigger());
      });
    });
  });
}
