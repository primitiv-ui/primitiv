/**
 * The SplitButton behaviour every Primitiv surface must share, written against
 * the DOM alone: Testing Library role queries and real keyboard and pointer
 * input, never a surface's own API. Each surface runs it with its own `mount`
 * (RFC 0033 §6.2, D12).
 */
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

/** The labels the fixture renders: each surface writes these into its own markup. */
export const SPLIT_BUTTON = {
  /** The action half's visible text. */
  action: "Squash and merge",
  /** The trigger half's own content, which names it before the action's. */
  trigger: "More merge options",
  /** The menu's two items. */
  first: "Create a merge commit",
  second: "Rebase and merge",
} as const;

/** Pure data describing one split button with a two-item menu; each surface turns it into its own markup. */
export type SplitButtonConformanceFixture = {
  /** The whole group disabled. */
  disabled?: boolean;
  /** The action half disabled alone. */
  actionDisabled?: boolean;
  /** The trigger half disabled alone. */
  triggerDisabled?: boolean;
  /** An explicit `aria-label` on the trigger, opting out of the derived name. */
  triggerLabel?: string;
};

/** Render `fixture` into `document.body`; resolves to a cleanup function once settled. */
export type SplitButtonMount = (fixture: SplitButtonConformanceFixture) => Promise<() => void>;

/** Let a surface's queued work (a reconcile, a React render) run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const group = () => screen.getByRole("group");
const action = () => screen.getByRole("button", { name: SPLIT_BUTTON.action });
const trigger = (name = `${SPLIT_BUTTON.trigger} ${SPLIT_BUTTON.action}`) => screen.getByRole("button", { name });
const item = (name: string) => screen.getByRole("menuitem", { name, hidden: true });

export function runSplitButtonConformance(mount: SplitButtonMount): void {
  let cleanup: (() => void) | undefined;

  const render = async (fixture: SplitButtonConformanceFixture = {}) => {
    cleanup = await mount(fixture);
  };

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  describe("SplitButton conformance", () => {
    describe("structure", () => {
      it("is a closed group of an action and a menu button", async () => {
        // Arrange & Act
        await render();

        // Assert
        expect(group().getAttribute("data-split-button")).toBe("");
        expect(group().getAttribute("data-state")).toBe("closed");
        expect(action().getAttribute("data-split-button-action")).toBe("");
        expect(action().hasAttribute("aria-haspopup")).toBe(false);
        expect(trigger().getAttribute("data-split-button-trigger")).toBe("");
        expect(trigger().getAttribute("aria-haspopup")).toBe("menu");
        expect(trigger().getAttribute("aria-expanded")).toBe("false");
      });

      it("names the trigger by its own content then the action's", async () => {
        // Arrange & Act
        await render();

        // Assert
        expect(trigger().getAttribute("aria-labelledby")).toBe(`${trigger().id} ${action().id}`);
      });

      it("leaves a trigger the consumer labelled", async () => {
        // Arrange & Act
        await render({ triggerLabel: "Options" });

        // Assert
        expect(trigger("Options").hasAttribute("aria-labelledby")).toBe(false);
      });

      it("keeps both halves in the tab order", async () => {
        // Arrange
        const user = userEvent.setup();
        await render();

        // Act
        await user.tab();
        const first = document.activeElement;
        await user.tab();

        // Assert
        expect(first).toBe(action());
        expect(document.activeElement).toBe(trigger());
      });
    });

    describe("opening", () => {
      it("opens from the action with ArrowDown, focusing the first item", async () => {
        // Arrange
        const user = userEvent.setup();
        await render();
        await user.tab();

        // Act
        await user.keyboard("{ArrowDown}");
        await settle();

        // Assert
        expect(group().getAttribute("data-state")).toBe("open");
        expect(trigger().getAttribute("aria-expanded")).toBe("true");
        expect(document.activeElement).toBe(item(SPLIT_BUTTON.first));
      });

      it("leaves the menu closed for the action's other keys", async () => {
        // Arrange
        const user = userEvent.setup();
        await render();
        await user.tab();

        // Act
        await user.keyboard("{ArrowUp}{ArrowRight}");
        await settle();

        // Assert
        expect(group().getAttribute("data-state")).toBe("closed");
      });

      it("opens from the trigger, and Escape closes it back onto the trigger", async () => {
        // Arrange
        const user = userEvent.setup();
        await render();

        // Act
        await user.click(trigger());
        await settle();
        const opened = group().getAttribute("data-state");
        await user.keyboard("{Escape}");
        await settle();

        // Assert
        expect(opened).toBe("open");
        expect(group().getAttribute("data-state")).toBe("closed");
        expect(document.activeElement).toBe(trigger());
      });

      it("closes once an alternative is chosen", async () => {
        // Arrange
        const user = userEvent.setup();
        await render();
        await user.tab();
        await user.keyboard("{ArrowDown}");
        await settle();

        // Act
        await user.click(item(SPLIT_BUTTON.second));
        await settle();

        // Assert
        expect(group().getAttribute("data-state")).toBe("closed");
        expect(document.activeElement).toBe(trigger());
      });
    });

    describe("disabled", () => {
      it("disables both halves with the group", async () => {
        // Arrange & Act
        await render({ disabled: true });

        // Assert
        expect(group().getAttribute("data-disabled")).toBe("");
        for (const half of [action(), trigger()]) {
          expect((half as HTMLButtonElement).disabled).toBe(true);
          expect(half.getAttribute("data-disabled")).toBe("");
        }
      });

      it("disables the action alone", async () => {
        // Arrange & Act
        await render({ actionDisabled: true });

        // Assert
        expect(group().hasAttribute("data-disabled")).toBe(false);
        expect((action() as HTMLButtonElement).disabled).toBe(true);
        expect(action().getAttribute("data-disabled")).toBe("");
        expect((trigger() as HTMLButtonElement).disabled).toBe(false);
        expect(trigger().hasAttribute("data-disabled")).toBe(false);
      });

      it("disables the trigger alone", async () => {
        // Arrange & Act
        await render({ triggerDisabled: true });

        // Assert
        expect((trigger() as HTMLButtonElement).disabled).toBe(true);
        expect(trigger().getAttribute("data-disabled")).toBe("");
        expect((action() as HTMLButtonElement).disabled).toBe(false);
        expect(action().hasAttribute("data-disabled")).toBe(false);
      });
    });
  });
}
