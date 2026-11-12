/**
 * The rich Select behaviour every Primitiv surface must share, written against
 * the DOM alone: Testing Library role queries and real keyboard and pointer
 * input, never a surface's own API. Each surface runs it with its own `mount`
 * (RFC 0033 §6.2, D12). Both surfaces take part in forms through a hidden
 * native `<select>`, so the form cases run on both.
 */
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

/** The items every fixture renders, in order. */
export const SELECT_ITEMS = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "blueberry", label: "Blueberry" },
  { value: "cherry", label: "Cherry" },
] as const;

/** Pure data describing one select; each surface turns it into its own markup. */
export type SelectConformanceFixture = {
  /** The initially chosen item. */
  value?: string;
  /** Submit under this name. */
  name?: string;
  required?: boolean;
  /** Items to disable. */
  disabled?: readonly string[];
  /** Give each item an indicator whose text is "✓". */
  indicators?: boolean;
  /** The value part's placeholder. Always "Pick a fruit" in these cases. */
  placeholder: string;
  /** The trigger button's accessible name. Always "Fruit" in these cases. */
  label: string;
};

/**
 * Render `fixture` inside a `<form>` in `document.body`; resolves to a cleanup
 * function once settled.
 */
export type SelectMount = (fixture: SelectConformanceFixture) => Promise<() => void>;

const trigger = () => screen.getByRole("button", { name: "Fruit" });
const option = (name: string) => screen.getByRole("option", { name, hidden: true });
const form = () => document.querySelector("form") as HTMLFormElement;
const shown = () => trigger().getAttribute("aria-expanded") === "true";

export function runSelectConformance(mount: SelectMount): void {
  let cleanup: (() => void) | undefined;

  const render = async (fixture: Omit<SelectConformanceFixture, "placeholder" | "label">) => {
    cleanup = await mount({ placeholder: "Pick a fruit", label: "Fruit", ...fixture });
  };

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  describe("Select conformance", () => {
    describe("structure", () => {
      it("is a closed trigger for a listbox, showing the placeholder until something is chosen", async () => {
        // Arrange & Act
        await render({});

        // Assert
        expect(trigger().getAttribute("aria-haspopup")).toBe("listbox");
        expect(trigger().getAttribute("aria-expanded")).toBe("false");
        expect(trigger().getAttribute("aria-controls")).toBe(screen.getByRole("listbox", { hidden: true }).id);
        expect(trigger().textContent).toBe("Pick a fruit");
        expect(trigger().querySelector("[data-placeholder]")).not.toBeNull();
      });

      it("shows the chosen item's text in the trigger, leaving its indicator out", async () => {
        // Arrange & Act
        await render({ value: "banana", indicators: true });

        // Assert
        expect(trigger().textContent).toBe("Banana");
        expect(trigger().querySelector("[data-placeholder]")).toBeNull();
        expect(option("✓Banana").getAttribute("aria-selected")).toBe("true");
        expect(option("✓Banana").getAttribute("data-state")).toBe("checked");
        expect(option("Apple").getAttribute("aria-selected")).toBe("false");
      });

      it("marks a disabled item", async () => {
        // Arrange & Act
        await render({ disabled: ["cherry"] });

        // Assert
        expect(option("Cherry").getAttribute("aria-disabled")).toBe("true");
        expect(option("Cherry").getAttribute("data-disabled")).toBe("");
      });
    });

    describe("opening and choosing", () => {
      it("opens from the trigger with focus on the chosen item", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "blueberry" });

        // Act
        await user.click(trigger());

        // Assert
        expect(shown()).toBe(true);
        expect(document.activeElement).toBe(option("Blueberry"));
      });

      it("opens with focus on the first item when nothing is chosen", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});

        // Act
        await user.click(trigger());

        // Assert
        expect(document.activeElement).toBe(option("Apple"));
      });

      it("chooses a clicked item, closing back to the trigger", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "apple" });
        await user.click(trigger());

        // Act
        await user.click(option("Cherry"));

        // Assert
        expect(trigger().textContent).toBe("Cherry");
        expect(shown()).toBe(false);
        expect(document.activeElement).toBe(trigger());
      });

      it("moves with the arrows, skipping a disabled item, and chooses with Enter", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "apple", disabled: ["banana"] });
        await user.click(trigger());

        // Act
        await user.keyboard("{ArrowDown}");
        const focused = document.activeElement;
        await user.keyboard("{Enter}");

        // Assert
        expect(focused).toBe(option("Blueberry"));
        expect(trigger().textContent).toBe("Blueberry");
        expect(document.activeElement).toBe(trigger());
      });

      it("wraps with the arrows and jumps with Home and End", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "apple" });
        await user.click(trigger());

        // Act
        await user.keyboard("{ArrowUp}");
        const wrapped = document.activeElement;
        await user.keyboard("{Home}");
        const home = document.activeElement;

        // Assert
        expect(wrapped).toBe(option("Cherry"));
        expect(home).toBe(option("Apple"));
      });

      it("jumps to the item a typed letter starts", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "apple" });
        await user.click(trigger());

        // Act
        await user.keyboard("b");
        const first = document.activeElement;
        await user.keyboard("b");

        // Assert
        expect(first).toBe(option("Banana"));
        expect(document.activeElement).toBe(option("Blueberry"));
      });

      it("closes on Escape without choosing, back to the trigger", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "apple" });
        await user.click(trigger());

        // Act
        await user.keyboard("{ArrowDown}{Escape}");

        // Assert
        expect(shown()).toBe(false);
        expect(trigger().textContent).toBe("Apple");
        expect(document.activeElement).toBe(trigger());
      });

      it("never chooses a disabled item", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ disabled: ["cherry"] });
        await user.click(trigger());

        // Act
        await user.click(option("Cherry"));

        // Assert
        expect(trigger().textContent).toBe("Pick a fruit");
      });
    });

    describe("forms", () => {
      it("submits the chosen value under its name", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ name: "fruit", value: "apple" });
        const before = new FormData(form()).get("fruit");
        await user.click(trigger());

        // Act
        await user.click(option("Cherry"));

        // Assert
        expect(before).toBe("apple");
        expect(new FormData(form()).get("fruit")).toBe("cherry");
      });

      it("blocks an empty submit while required", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ name: "fruit", required: true });
        const before = form().checkValidity();
        await user.click(trigger());

        // Act
        await user.click(option("Apple"));

        // Assert
        expect(before).toBe(false);
        expect(form().checkValidity()).toBe(true);
      });
    });
  });
}
