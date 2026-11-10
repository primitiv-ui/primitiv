/**
 * The Popover behaviour every Primitiv surface must share, written against the
 * DOM alone: Testing Library role queries and real keyboard and pointer input,
 * never a surface's own API. Each surface runs it with its own `mount`, so a
 * behaviour one surface has and the other lacks fails here (RFC 0033 §6.2,
 * D12).
 *
 * jsdom has no Popover API, so each surface loads its own scoped polyfill
 * before running this, and the outside-press fallback stands in for the
 * browser's light dismiss. jsdom cannot tell an open popover is visible, so
 * queries inside the panel pass `hidden: true`. What a surface does *differently on purpose* —
 * React's `asChild` and anchor wiring, the elements' reflected attribute,
 * events and implicit anchor — belongs in that surface's own suite.
 */
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

/** The text every fixture renders: the trigger, the title, the description, a field and the close button. */
export const POPOVER = {
  open: "Edit",
  title: "Profile",
  description: "Update your display name.",
  field: "Display name",
  close: "Done",
  outside: "Outside",
} as const;

/** Pure data describing one popover; each surface turns it into its own markup. */
export type PopoverConformanceFixture = {
  /** Whether it starts open. */
  open?: boolean;
};

/**
 * Render `fixture` into `document.body` — a trigger, then a panel holding the
 * title, the description, a text field labelled {@link POPOVER}`.field` and a
 * close button, then a button outside it labelled {@link POPOVER}`.outside` —
 * and resolve once it has settled. Resolves to a cleanup.
 */
export type PopoverMount = (fixture: PopoverConformanceFixture) => Promise<() => void>;

const trigger = () => screen.getByRole("button", { name: POPOVER.open });
const panel = () => document.getElementById(trigger().getAttribute("aria-controls") ?? "") as HTMLElement;
const isOpen = () => trigger().getAttribute("aria-expanded") === "true" && panel().getAttribute("data-state") === "open";
const isClosed = () =>
  trigger().getAttribute("aria-expanded") === "false" && panel().getAttribute("data-state") === "closed";
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

export function runPopoverConformance(mount: PopoverMount): void {
  let cleanup: (() => void) | undefined;

  const render = async (fixture: PopoverConformanceFixture) => {
    cleanup = await mount(fixture);
  };

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  describe("Popover conformance", () => {
    describe("structure", () => {
      it("points the trigger at its closed dialog panel", async () => {
        // Arrange & Act
        await render({});

        // Assert
        expect(trigger().getAttribute("aria-haspopup")).toBe("dialog");
        expect(panel().getAttribute("role")).toBe("dialog");
        expect(panel().getAttribute("popover")).toBe("auto");
        expect(isClosed()).toBe(true);
      });

      it("names and describes the panel by its title and description", async () => {
        // Arrange & Act
        await render({ open: true });

        // Assert
        expect(document.getElementById(panel().getAttribute("aria-labelledby") ?? "")?.textContent).toBe(POPOVER.title);
        expect(document.getElementById(panel().getAttribute("aria-describedby") ?? "")?.textContent).toBe(
          POPOVER.description,
        );
      });
    });

    describe("opening and closing", () => {
      it("opens on a click on the trigger, moving focus to the panel's first control", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});

        // Act
        await user.click(trigger());

        // Assert
        expect(isOpen()).toBe(true);
        expect(document.activeElement).toBe(screen.getByRole("textbox", { name: POPOVER.field, hidden: true }));
      });

      it("closes on a second click on the trigger", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});

        // Act
        await user.click(trigger());
        await user.click(trigger());

        // Assert
        expect(isClosed()).toBe(true);
      });

      it("closes on the close button", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ open: true });

        // Act
        await user.click(screen.getByRole("button", { name: POPOVER.close, hidden: true }));

        // Assert
        expect(isClosed()).toBe(true);
      });

      it("closes on Escape inside the panel and hands focus back to the trigger", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ open: true });
        await user.click(screen.getByRole("textbox", { name: POPOVER.field, hidden: true }));

        // Act
        await user.keyboard("{Escape}");
        await settle();

        // Assert
        expect(isClosed()).toBe(true);
        expect(document.activeElement).toBe(trigger());
      });

      it("closes on a press outside, and not on one inside", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ open: true });

        // Act
        await user.click(screen.getByRole("textbox", { name: POPOVER.field, hidden: true }));
        const afterInside = isOpen();
        await user.click(screen.getByRole("button", { name: POPOVER.outside }));

        // Assert
        expect(afterInside).toBe(true);
        expect(isClosed()).toBe(true);
      });
    });
  });
}
