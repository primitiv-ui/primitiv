/**
 * The Collapsible behaviour every Primitiv surface must share, written against
 * the DOM alone: Testing Library role queries and real keyboard and pointer
 * input, never a surface's own API. Each surface runs it with its own `mount`,
 * so a behaviour one surface has and the other lacks fails here (RFC 0033 §6.2,
 * D12).
 *
 * What a surface does *differently on purpose* — React's `asChild`,
 * `forceMount`, `collapsedHeight` and callbacks, the elements' reflected
 * attributes and DOM events — belongs in that surface's own suite, not here.
 */
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

/** The trigger's label and the panel's text every fixture renders. */
export const COLLAPSIBLE = { label: "Toggle", panel: "Hidden content" } as const;

/** Pure data describing one collapsible; each surface turns it into its own markup. */
export type CollapsibleConformanceFixture = {
  /** Whether it starts open. */
  open?: boolean;
  disabled?: boolean;
};

/**
 * Render `fixture` into `document.body` and resolve once it has settled.
 * Resolves to a cleanup function.
 */
export type CollapsibleMount = (fixture: CollapsibleConformanceFixture) => Promise<() => void>;

const trigger = () => screen.getByRole("button", { name: COLLAPSIBLE.label });
const panel = () => document.getElementById(trigger().getAttribute("aria-controls") ?? "") as HTMLElement;
const isOpen = () => trigger().getAttribute("aria-expanded") === "true" && !panel().hidden;
const isClosed = () => trigger().getAttribute("aria-expanded") === "false" && panel().hidden;

export function runCollapsibleConformance(mount: CollapsibleMount): void {
  let cleanup: (() => void) | undefined;

  const render = async (fixture: CollapsibleConformanceFixture) => {
    cleanup = await mount(fixture);
  };

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  describe("Collapsible conformance", () => {
    describe("structure", () => {
      it("points the trigger at its panel, and hides the panel while closed", async () => {
        // Arrange & Act
        await render({});

        // Assert
        expect(panel().textContent).toBe(COLLAPSIBLE.panel);
        expect(isClosed()).toBe(true);
      });

      it("shows the panel when it starts open", async () => {
        // Arrange & Act
        await render({ open: true });

        // Assert
        expect(isOpen()).toBe(true);
      });

      it("publishes data-state on the trigger and the panel", async () => {
        // Arrange & Act
        await render({ open: true });

        // Assert
        expect(trigger().getAttribute("data-state")).toBe("open");
        expect(panel().getAttribute("data-state")).toBe("open");
      });
    });

    describe("pointer", () => {
      it("opens on a click and closes on a second", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});

        // Act
        await user.click(trigger());
        const afterOpen = isOpen();
        await user.click(trigger());

        // Assert
        expect(afterOpen).toBe(true);
        expect(isClosed()).toBe(true);
        expect(panel().getAttribute("data-state")).toBe("closed");
      });
    });

    describe("keyboard", () => {
      it("toggles with Enter and Space", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        trigger().focus();

        // Act
        await user.keyboard("{Enter}");
        const afterEnter = isOpen();
        await user.keyboard(" ");

        // Assert
        expect(afterEnter).toBe(true);
        expect(isClosed()).toBe(true);
      });
    });

    describe("disabled", () => {
      it("is marked, stays in the Tab order, and never toggles", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ disabled: true });

        // Act
        await user.tab();
        const focused = document.activeElement;
        await user.keyboard("{Enter}");
        await user.click(trigger());

        // Assert
        expect(trigger().getAttribute("aria-disabled")).toBe("true");
        expect(focused).toBe(trigger());
        expect(isClosed()).toBe(true);
      });
    });
  });
}
