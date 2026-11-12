/**
 * The Combobox behaviour every Primitiv surface must share, written against
 * the DOM alone: Testing Library role queries and real keyboard and pointer
 * input, never a surface's own API. Each surface runs it with its own `mount`
 * (RFC 0033 §6.2, D12). Filtering is consumer-owned on both surfaces, so every
 * fixture renders all of its items.
 */
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

/** The items every fixture renders, in order. */
export const COMBOBOX_ITEMS = [
  { value: "react", label: "React" },
  { value: "preact", label: "Preact" },
  { value: "vue", label: "Vue" },
] as const;

/** Pure data describing one combobox; each surface turns it into its own markup. */
export type ComboboxConformanceFixture = {
  /** The field's accessible name. Always "Framework" in these cases. */
  label: string;
};

/** Render `fixture` in `document.body`; resolves to a cleanup function once settled. */
export type ComboboxMount = (fixture: ComboboxConformanceFixture) => Promise<() => void>;

const field = () => screen.getByRole("combobox", { name: "Framework" }) as HTMLInputElement;
const option = (name: string) => screen.getByRole("option", { name, hidden: true });
const expanded = () => field().getAttribute("aria-expanded") === "true";

export function runComboboxConformance(mount: ComboboxMount): void {
  let cleanup: (() => void) | undefined;

  const render = async () => {
    cleanup = await mount({ label: "Framework" });
  };

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  describe("Combobox conformance", () => {
    describe("structure", () => {
      it("is a closed, list-autocomplete combobox that controls a listbox", async () => {
        // Arrange & Act
        await render();

        // Assert
        expect(field().getAttribute("aria-autocomplete")).toBe("list");
        expect(field().getAttribute("aria-expanded")).toBe("false");
        expect(field().getAttribute("aria-controls")).toBeTruthy();
        expect(field().hasAttribute("aria-activedescendant")).toBe(false);
      });
    });

    describe("opening", () => {
      it("opens as the user types, keeping focus in the field", async () => {
        // Arrange
        const user = userEvent.setup();
        await render();

        // Act
        await user.type(field(), "re");

        // Assert
        expect(expanded()).toBe(true);
        expect(field().value).toBe("re");
        expect(field()).toBe(document.activeElement);
        expect(field().getAttribute("aria-controls")).toBe(screen.getByRole("listbox", { hidden: true }).id);
      });

      it("opens on ArrowDown without placing a cursor", async () => {
        // Arrange
        const user = userEvent.setup();
        await render();
        await user.click(field());

        // Act
        await user.keyboard("{ArrowDown}");

        // Assert
        expect(expanded()).toBe(true);
        expect(field().hasAttribute("aria-activedescendant")).toBe(false);
      });
    });

    describe("the cursor", () => {
      it("enters at the first option on ArrowDown and moves on, published on the field and the option", async () => {
        // Arrange
        const user = userEvent.setup();
        await render();
        await user.type(field(), "r");

        // Act
        await user.keyboard("{ArrowDown}{ArrowDown}");

        // Assert
        expect(field().getAttribute("aria-activedescendant")).toBe(option("Preact").id);
        expect(option("Preact").hasAttribute("data-highlighted")).toBe(true);
        expect(option("React").hasAttribute("data-highlighted")).toBe(false);
        expect(field()).toBe(document.activeElement);
      });

      it("enters at the last option on ArrowUp, and wraps at either end", async () => {
        // Arrange
        const user = userEvent.setup();
        await render();
        await user.type(field(), "r");

        // Act
        await user.keyboard("{ArrowUp}");
        const entered = field().getAttribute("aria-activedescendant");
        await user.keyboard("{ArrowDown}");

        // Assert
        expect(entered).toBe(option("Vue").id);
        expect(field().getAttribute("aria-activedescendant")).toBe(option("React").id);
      });

      it("jumps to the ends on Home and End", async () => {
        // Arrange
        const user = userEvent.setup();
        await render();
        await user.type(field(), "r");
        await user.keyboard("{ArrowDown}");

        // Act
        await user.keyboard("{End}");
        const end = field().getAttribute("aria-activedescendant");
        await user.keyboard("{Home}");

        // Assert
        expect(end).toBe(option("Vue").id);
        expect(field().getAttribute("aria-activedescendant")).toBe(option("React").id);
      });
    });

    describe("committing", () => {
      it("commits the option under the cursor on Enter: the field shows its text and the popup closes", async () => {
        // Arrange
        const user = userEvent.setup();
        await render();
        await user.type(field(), "p");

        // Act
        await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

        // Assert
        expect(field().value).toBe("Preact");
        expect(expanded()).toBe(false);
        expect(field().hasAttribute("aria-activedescendant")).toBe(false);
      });

      it("commits a clicked option, keeping focus in the field, and marks it selected", async () => {
        // Arrange
        const user = userEvent.setup();
        await render();
        await user.type(field(), "v");

        // Act
        await user.click(option("Vue"));
        await user.keyboard("{ArrowDown}");

        // Assert
        expect(field().value).toBe("Vue");
        expect(field()).toBe(document.activeElement);
        expect(option("Vue").getAttribute("aria-selected")).toBe("true");
        expect(option("React").getAttribute("aria-selected")).toBe("false");
      });
    });

    describe("dismissing", () => {
      it("closes on Escape and puts the committed text back over the query", async () => {
        // Arrange
        const user = userEvent.setup();
        await render();
        await user.type(field(), "v");
        await user.click(option("Vue"));
        await user.type(field(), "xyz");

        // Act
        await user.keyboard("{Escape}");

        // Assert
        expect(expanded()).toBe(false);
        expect(field().value).toBe("Vue");
      });

      it("clears the value when the field is emptied, so Escape leaves it empty", async () => {
        // Arrange
        const user = userEvent.setup();
        await render();
        await user.type(field(), "v");
        await user.click(option("Vue"));

        // Act
        await user.clear(field());
        await user.keyboard("{Escape}{ArrowDown}");

        // Assert
        expect(field().value).toBe("");
        expect(option("Vue").getAttribute("aria-selected")).toBe("false");
      });
    });
  });
}
