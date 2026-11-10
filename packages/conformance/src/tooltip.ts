/**
 * The Tooltip behaviour every Primitiv surface must share, written against the
 * DOM alone: Testing Library role queries and real pointer, focus and keyboard
 * input, never a surface's own API. Each surface runs it with its own `mount`,
 * so a behaviour one surface has and the other lacks fails here (RFC 0033
 * §6.2, D12). Every fixture opens with no delay, so the suite needs no fake
 * timers; only the pointer's grace period is waited out.
 *
 * What a surface does *differently on purpose* — React's portal, `asChild` and
 * callbacks, the elements' reflected attribute, events and top-layer popover —
 * belongs in that surface's own suite.
 */
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

/** The trigger's label and the tooltip's text every fixture renders. */
export const TOOLTIP = { label: "Save", tip: "Saves your work" } as const;

/** Pure data describing one tooltip; each surface turns it into its own markup, with no open delay. */
export type TooltipConformanceFixture = {
  /** Whether it starts open. */
  open?: boolean;
};

/**
 * Render `fixture` into `document.body` — a trigger button and its tooltip,
 * opening with no delay — and resolve once it has settled. Resolves to a cleanup.
 */
export type TooltipMount = (fixture: TooltipConformanceFixture) => Promise<() => void>;

const trigger = () => screen.getByRole("button", { name: TOOLTIP.label });
const tooltip = () => document.getElementById(trigger().getAttribute("aria-describedby") ?? "");
const isOpen = () =>
  trigger().getAttribute("data-state") === "open" && tooltip()?.getAttribute("data-state") === "open";
const isClosed = () => trigger().getAttribute("data-state") === "closed";
const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

export function runTooltipConformance(mount: TooltipMount): void {
  let cleanup: (() => void) | undefined;

  const render = async (fixture: TooltipConformanceFixture) => {
    cleanup = await mount(fixture);
  };

  afterEach(async () => {
    cleanup?.();
    cleanup = undefined;
    // Let the group's skip-delay window run out between cases.
    await wait(350);
  });

  describe("Tooltip conformance", () => {
    describe("structure", () => {
      it("describes the trigger by a tooltip that holds the text", async () => {
        // Arrange & Act
        await render({ open: true });

        // Assert
        expect(tooltip()?.getAttribute("role")).toBe("tooltip");
        expect(tooltip()?.textContent).toBe(TOOLTIP.tip);
        expect(isOpen()).toBe(true);
      });

      it("is closed until something opens it", async () => {
        // Arrange & Act
        await render({});

        // Assert
        expect(isClosed()).toBe(true);
      });
    });

    describe("focus", () => {
      it("opens at once on focus, and closes on blur", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});

        // Act
        await user.tab();
        await wait();
        const afterFocus = isOpen();
        await user.tab();
        await wait();

        // Assert
        expect(afterFocus).toBe(true);
        expect(isClosed()).toBe(true);
      });
    });

    describe("pointer", () => {
      it("opens on hover, and closes once the pointer has left for the grace period", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});

        // Act
        await user.hover(trigger());
        await wait();
        const afterEnter = isOpen();
        await user.unhover(trigger());
        await wait(150);

        // Assert
        expect(afterEnter).toBe(true);
        expect(isClosed()).toBe(true);
      });

      it("stays open when the pointer reaches the tooltip within the grace period", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        await user.hover(trigger());
        await wait();

        // Act
        await user.hover(tooltip() as HTMLElement);
        await wait(150);

        // Assert
        expect(isOpen()).toBe(true);
      });

      it("closes on a press outside", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ open: true });

        // Act
        await user.pointer({ keys: "[MouseLeft>]", target: document.body });
        await wait();

        // Assert
        expect(isClosed()).toBe(true);
      });
    });

    describe("keyboard", () => {
      it("closes on Escape", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ open: true });

        // Act
        await user.keyboard("{Escape}");
        await wait();

        // Assert
        expect(isClosed()).toBe(true);
      });
    });
  });
}
