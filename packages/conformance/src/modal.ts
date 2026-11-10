/**
 * The Modal behaviour every Primitiv surface must share, written against the
 * DOM alone: Testing Library role queries and real keyboard and pointer input,
 * never a surface's own API. Each surface runs it with its own `mount`, so a
 * behaviour one surface has and the other lacks fails here (RFC 0033 §6.2,
 * D12).
 *
 * jsdom has no `showModal()`, so each surface loads its own scoped `<dialog>`
 * polyfill before running this, and Escape is simulated as the native `cancel`
 * event the browser fires for it. What a surface does *differently on
 * purpose* — React's `asChild`, portal, overlay and callbacks, the elements'
 * reflected attribute and DOM events — belongs in that surface's own suite.
 */
import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

/** The text every fixture renders: the trigger, the title, the description and the close button. */
export const MODAL = {
  open: "Open",
  title: "Payment",
  description: "Enter your card details.",
  field: "Card number",
  close: "Cancel",
} as const;

/** Pure data describing one modal; each surface turns it into its own markup. */
export type ModalConformanceFixture = {
  /** Whether it starts open. */
  open?: boolean;
};

/**
 * Render `fixture` into `document.body` — a trigger, then a dialog holding the
 * title, the description, a text field labelled {@link MODAL}`.field` and a
 * close button — and resolve once it has settled. Resolves to a cleanup.
 */
export type ModalMount = (fixture: ModalConformanceFixture) => Promise<() => void>;

const trigger = () => screen.getByRole("button", { name: MODAL.open });
const dialog = () => document.getElementById(trigger().getAttribute("aria-controls") ?? "") as HTMLDialogElement;
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

export function runModalConformance(mount: ModalMount): void {
  let cleanup: (() => void) | undefined;

  const render = async (fixture: ModalConformanceFixture) => {
    cleanup = await mount(fixture);
  };

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  describe("Modal conformance", () => {
    describe("structure", () => {
      it("points the trigger at its closed dialog", async () => {
        // Arrange & Act
        await render({});

        // Assert
        expect(trigger().getAttribute("aria-haspopup")).toBe("dialog");
        expect(trigger().getAttribute("aria-expanded")).toBe("false");
        expect(dialog().localName).toBe("dialog");
        expect(dialog().open).toBe(false);
        expect(dialog().getAttribute("data-state")).toBe("closed");
      });

      it("opens a dialog that starts open, named and described by its title and description", async () => {
        // Arrange & Act
        await render({ open: true });

        // Assert
        const open = screen.getByRole("dialog", { name: MODAL.title });
        expect(open).toBe(dialog());
        expect(open).toHaveProperty("open", true);
        expect(open.getAttribute("data-state")).toBe("open");
        expect(document.getElementById(open.getAttribute("aria-describedby") ?? "")?.textContent).toBe(
          MODAL.description,
        );
        expect(trigger().getAttribute("aria-expanded")).toBe("true");
      });
    });

    describe("opening and closing", () => {
      it("opens on a click on the trigger, and closes on the close button", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});

        // Act
        await user.click(trigger());
        const afterOpen = dialog().open;
        await user.click(screen.getByRole("button", { name: MODAL.close }));

        // Assert
        expect(afterOpen).toBe(true);
        expect(dialog().open).toBe(false);
        expect(trigger().getAttribute("aria-expanded")).toBe("false");
      });

      it("closes on Escape", async () => {
        // Arrange
        await render({ open: true });
        const cancel = new Event("cancel", { cancelable: true });

        // Act
        fireEvent(dialog(), cancel);
        await settle();

        // Assert
        expect(dialog().open).toBe(false);
      });

      it("closes on a press on the backdrop, and not on one inside the dialog", async () => {
        // Arrange
        await render({ open: true });
        dialog().getBoundingClientRect = () => ({ left: 100, top: 100, right: 300, bottom: 300 }) as DOMRect;

        // Act
        fireEvent.pointerDown(dialog(), { clientX: 200, clientY: 200 });
        await settle();
        const afterInside = dialog().open;
        fireEvent.pointerDown(dialog(), { clientX: 20, clientY: 20 });
        await settle();

        // Assert
        expect(afterInside).toBe(true);
        expect(dialog().open).toBe(false);
      });
    });

    describe("focus trap", () => {
      it("wraps Tab from the last control to the first, and Shift+Tab back", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ open: true });
        const field = screen.getByRole("textbox", { name: MODAL.field });
        const close = screen.getByRole("button", { name: MODAL.close });
        close.focus();

        // Act
        await user.tab();
        const afterTab = document.activeElement;
        await user.tab({ shift: true });

        // Assert
        expect(afterTab).toBe(field);
        expect(document.activeElement).toBe(close);
      });
    });
  });
}
