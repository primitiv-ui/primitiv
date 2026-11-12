/**
 * The Listbox behaviour every Primitiv surface must share, written against the
 * DOM alone: Testing Library role queries and real keyboard and pointer input,
 * never a surface's own API. Each surface runs it with its own `mount`
 * (RFC 0033 §6.2, D12).
 */
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/** The options every fixture renders, in order. */
export const LISTBOX_OPTIONS = [
  { value: "apple", label: "Apple" },
  { value: "avocado", label: "Avocado" },
  { value: "banana", label: "Banana" },
  { value: "carrot", label: "Carrot" },
] as const;

/** Pure data describing one listbox; each surface turns it into its own markup. */
export type ListboxConformanceFixture = {
  type: "single" | "multiple";
  /** The initially selected options. */
  value?: readonly string[];
  orientation?: "horizontal" | "vertical";
  dir?: "ltr" | "rtl";
  selectionFollowsFocus?: boolean;
  disabled?: readonly string[];
  /** Put the first three options in a group labelled "Fruit" and the last in one labelled "Vegetables". */
  grouped?: boolean;
  /** The listbox's accessible name. Always "Produce" in these cases. */
  label: string;
};

/** Render `fixture` into `document.body`, followed by a button to Tab to; resolves to a cleanup function once settled. */
export type ListboxMount = (fixture: ListboxConformanceFixture) => Promise<() => void>;

const listbox = () => screen.getByRole("listbox");
const option = (name: string) => screen.getByRole("option", { name });
const cursor = () => {
  const id = listbox().getAttribute("aria-activedescendant");
  return id === null ? null : document.getElementById(id)?.textContent;
};
const selected = () =>
  screen
    .getAllByRole("option")
    .filter((o) => o.getAttribute("aria-selected") === "true")
    .map((o) => o.textContent);

export function runListboxConformance(mount: ListboxMount): void {
  let cleanup: (() => void) | undefined;

  const render = async (fixture: Omit<ListboxConformanceFixture, "label">) => {
    cleanup = await mount({ label: "Produce", ...fixture });
  };

  beforeEach(() => {
    // jsdom has no scrollIntoView, which the cursor asks for on every move.
    if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  describe("Listbox conformance", () => {
    describe("structure", () => {
      it("renders a named listbox of options, selecting those in its value", async () => {
        // Arrange & Act
        await render({ type: "multiple", value: ["apple", "banana"] });

        // Assert
        const root = screen.getByRole("listbox", { name: "Produce" });
        expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Apple", "Avocado", "Banana", "Carrot"]);
        expect(selected()).toEqual(["Apple", "Banana"]);
        expect(root.getAttribute("aria-multiselectable")).toBe("true");
        expect(root.getAttribute("data-orientation")).toBe("vertical");
      });

      it("is a single tab stop, with no cursor until it takes focus", async () => {
        // Arrange & Act
        await render({ type: "single", value: ["banana"] });

        // Assert
        expect(listbox().getAttribute("tabindex")).toBe("0");
        expect(listbox().hasAttribute("aria-multiselectable")).toBe(false);
        expect(listbox().hasAttribute("aria-activedescendant")).toBe(false);
      });

      it("marks a disabled option", async () => {
        // Arrange & Act
        await render({ type: "single", disabled: ["avocado"] });

        // Assert
        expect(option("Avocado").getAttribute("aria-disabled")).toBe("true");
        expect(option("Avocado").getAttribute("data-disabled")).toBe("");
      });

      it("names each group by its label", async () => {
        // Arrange & Act
        await render({ type: "single", grouped: true });

        // Assert
        expect(screen.getByRole("group", { name: "Fruit" })).toBeDefined();
        expect(screen.getByRole("group", { name: "Vegetables" })).toBeDefined();
      });
    });

    describe("cursor", () => {
      it("lands on the first selected option when the listbox takes focus, and clears on blur", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "multiple", value: ["carrot", "banana"] });

        // Act
        await user.tab();
        const during = cursor();
        const highlighted = option("Banana").getAttribute("data-highlighted");
        await user.tab();

        // Assert
        expect(during).toBe("Banana");
        expect(highlighted).toBe("");
        expect(listbox().hasAttribute("aria-activedescendant")).toBe(false);
        expect(option("Banana").hasAttribute("data-highlighted")).toBe(false);
      });

      it("lands on the first option when nothing is selected", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "single" });

        // Act
        await user.tab();

        // Assert
        expect(cursor()).toBe("Apple");
      });

      it("moves with the arrows and wraps, keeping focus on the listbox", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "single" });
        await user.tab();

        // Act
        await user.keyboard("{ArrowUp}");
        const wrapped = cursor();
        await user.keyboard("{ArrowDown}{ArrowDown}");

        // Assert
        expect(wrapped).toBe("Carrot");
        expect(cursor()).toBe("Avocado");
        expect(document.activeElement).toBe(listbox());
        expect(selected()).toEqual([]);
      });

      it("jumps to the ends with Home and End", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "single" });
        await user.tab();

        // Act
        await user.keyboard("{End}");
        const end = cursor();
        await user.keyboard("{Home}");

        // Assert
        expect(end).toBe("Carrot");
        expect(cursor()).toBe("Apple");
      });

      it("skips a disabled option", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "single", disabled: ["avocado"] });
        await user.tab();

        // Act
        await user.keyboard("{ArrowDown}");

        // Assert
        expect(cursor()).toBe("Banana");
      });

      it("uses the horizontal arrows, mirrored under right-to-left, in a horizontal listbox", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "single", orientation: "horizontal", dir: "rtl" });
        await user.tab();

        // Act
        await user.keyboard("{ArrowLeft}");

        // Assert
        expect(listbox().getAttribute("aria-orientation")).toBe("horizontal");
        expect(cursor()).toBe("Avocado");
      });

      it("jumps to the option whose text starts with what is typed", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "single" });
        await user.tab();

        // Act
        await user.keyboard("a");

        // Assert
        expect(cursor()).toBe("Avocado");
      });

      it("moves through groups as one list", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "single", grouped: true });
        await user.tab();

        // Act
        await user.keyboard("{ArrowUp}");

        // Assert
        expect(cursor()).toBe("Carrot");
      });
    });

    describe("choosing", () => {
      it("selects the option under the cursor on Enter and on Space, replacing the selection", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "single", value: ["apple"] });
        await user.tab();

        // Act
        await user.keyboard("{ArrowDown}{Enter}");
        const afterEnter = selected();
        await user.keyboard("{ArrowDown} ");

        // Assert
        expect(afterEnter).toEqual(["Avocado"]);
        expect(selected()).toEqual(["Banana"]);
      });

      it("chooses a clicked option and moves the cursor to it", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "single" });

        // Act
        await user.click(option("Banana"));

        // Assert
        expect(selected()).toEqual(["Banana"]);
        expect(cursor()).toBe("Banana");
      });

      it("never chooses a disabled option", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "single", disabled: ["avocado"] });

        // Act
        await user.click(option("Avocado"));

        // Assert
        expect(selected()).toEqual([]);
      });

      it("selects as the cursor moves when selection follows focus", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "single", selectionFollowsFocus: true });
        await user.tab();

        // Act
        await user.keyboard("{ArrowDown}");

        // Assert
        expect(selected()).toEqual(["Avocado"]);
      });
    });

    describe("multiple", () => {
      it("toggles options independently", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "multiple", value: ["apple"] });

        // Act
        await user.click(option("Banana"));
        await user.click(option("Apple"));

        // Assert
        expect(selected()).toEqual(["Banana"]);
      });

      it("extends the selection with Shift+Arrow", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "multiple", value: ["apple"] });
        await user.tab();

        // Act
        await user.keyboard("{Shift>}{ArrowDown}{ArrowDown}{/Shift}");

        // Assert
        expect(selected()).toEqual(["Apple", "Avocado", "Banana"]);
        expect(cursor()).toBe("Banana");
      });

      it("selects every option with Ctrl+A, and none on a second press", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "multiple", disabled: ["carrot"] });
        await user.tab();

        // Act
        await user.keyboard("{Control>}a{/Control}");
        const all = selected();
        await user.keyboard("{Control>}a{/Control}");

        // Assert
        expect(all).toEqual(["Apple", "Avocado", "Banana"]);
        expect(selected()).toEqual([]);
      });

      it("selects from the cursor to the end with Ctrl+Shift+End", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "multiple" });
        await user.tab();
        await user.keyboard("{ArrowDown}");

        // Act
        await user.keyboard("{Control>}{Shift>}{End}{/Shift}{/Control}");

        // Assert
        expect(selected()).toEqual(["Avocado", "Banana", "Carrot"]);
        expect(cursor()).toBe("Carrot");
      });
    });
  });
}
