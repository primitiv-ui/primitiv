/**
 * The Accordion behaviour every Primitiv surface must share, written against the
 * DOM alone: Testing Library role queries and real keyboard and pointer input,
 * never a surface's own API. Each surface runs it with its own `mount`, so a
 * behaviour one surface has and the other lacks fails here (RFC 0033 §6.2, D12).
 *
 * What a surface does *differently on purpose* — React's `asChild`, `forceMount`
 * and callbacks, the elements' reflected attributes and DOM events — belongs in
 * that surface's own suite, not here.
 */
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

/** The items every fixture renders, in order. */
export const ACCORDION_ITEMS = [
  { value: "one", label: "One", panel: "First panel" },
  { value: "two", label: "Two", panel: "Second panel" },
  { value: "three", label: "Three", panel: "Third panel" },
] as const;

/**
 * Pure data describing one accordion; each surface turns it into its own
 * markup. Every trigger sits in an `<h3>`.
 */
export type AccordionConformanceFixture = {
  /** The initially open item. One at most, since React's `defaultValue` seeds one. */
  value?: string;
  multiple?: boolean;
  orientation?: "vertical" | "horizontal";
  dir?: "ltr" | "rtl";
  disabled?: readonly string[];
};

/**
 * Render `fixture` into `document.body` and resolve once it has settled.
 * Resolves to a cleanup function.
 */
export type AccordionMount = (fixture: AccordionConformanceFixture) => Promise<() => void>;

const trigger = (name: string) => screen.getByRole("button", { name });
const expanded = () =>
  screen.getAllByRole("button").filter((button) => button.getAttribute("aria-expanded") === "true");
const openPanels = () => screen.queryAllByRole("region").map((panel) => panel.textContent);

export function runAccordionConformance(mount: AccordionMount): void {
  let cleanup: (() => void) | undefined;

  const render = async (fixture: AccordionConformanceFixture) => {
    cleanup = await mount(fixture);
  };

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  describe("Accordion conformance", () => {
    describe("structure", () => {
      it("renders a button in a heading per item, and shows only the open items' panels", async () => {
        // Arrange & Act
        await render({ value: "two" });

        // Assert
        const headings = screen.getAllByRole("heading", { level: 3 });
        expect(headings.map((heading) => heading.textContent)).toEqual(["One", "Two", "Three"]);
        expect(screen.getAllByRole("button").map((b) => b.getAttribute("aria-expanded"))).toEqual([
          "false",
          "true",
          "false",
        ]);
        expect(openPanels()).toEqual(["Second panel"]);
      });

      it("labels a panel by its trigger and points the trigger at its panel", async () => {
        // Arrange & Act
        await render({ value: "one" });

        // Assert
        const panel = screen.getByRole("region", { name: "One" });
        expect(trigger("One").getAttribute("aria-controls")).toBe(panel.id);
      });

      it("publishes data-state on triggers and panels", async () => {
        // Arrange & Act
        await render({ value: "one" });

        // Assert
        expect(trigger("One").getAttribute("data-state")).toBe("open");
        expect(trigger("Two").getAttribute("data-state")).toBe("closed");
        expect(screen.getByRole("region").getAttribute("data-state")).toBe("open");
      });

      it("keeps every trigger in the Tab order — there is no roving tab stop", async () => {
        // Arrange & Act
        await render({ value: "one" });

        // Assert
        expect(screen.getAllByRole("button").map((b) => b.tabIndex)).toEqual([0, 0, 0]);
      });
    });

    describe("pointer", () => {
      it("opens a clicked item and closes it on a second click", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});

        // Act
        await user.click(trigger("Two"));
        const afterOpen = openPanels();
        await user.click(trigger("Two"));

        // Assert
        expect(afterOpen).toEqual(["Second panel"]);
        expect(expanded()).toEqual([]);
      });

      it("closes the open item when another opens", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "one" });

        // Act
        await user.click(trigger("Three"));

        // Assert
        expect(expanded()).toEqual([trigger("Three")]);
        expect(openPanels()).toEqual(["Third panel"]);
      });

      it("keeps several items open in multiple mode", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "one", multiple: true });

        // Act
        await user.click(trigger("Three"));

        // Assert
        expect(openPanels()).toEqual(["First panel", "Third panel"]);
      });
    });

    describe("keyboard", () => {
      it("moves focus with the arrows, wrapping at the ends, without toggling", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        trigger("One").focus();

        // Act
        await user.keyboard("{ArrowUp}");
        const wrapped = document.activeElement;
        await user.keyboard("{ArrowDown}");

        // Assert
        expect(wrapped).toBe(trigger("Three"));
        expect(trigger("One")).toBe(document.activeElement);
        expect(expanded()).toEqual([]);
      });

      it("jumps with Home and End", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        trigger("Two").focus();

        // Act
        await user.keyboard("{End}");
        const atEnd = document.activeElement;
        await user.keyboard("{Home}");

        // Assert
        expect(atEnd).toBe(trigger("Three"));
        expect(trigger("One")).toBe(document.activeElement);
      });

      it("toggles the focused item with Enter and Space", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        trigger("Two").focus();

        // Act
        await user.keyboard("{Enter}");
        const afterEnter = openPanels();
        await user.keyboard(" ");

        // Assert
        expect(afterEnter).toEqual(["Second panel"]);
        expect(expanded()).toEqual([]);
      });

      it("uses the horizontal arrows, mirrored right to left, when horizontal", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ orientation: "horizontal", dir: "rtl" });
        trigger("One").focus();

        // Act
        await user.keyboard("{ArrowDown}{ArrowLeft}");

        // Assert
        expect(trigger("Two")).toBe(document.activeElement);
      });
    });

    describe("disabled items", () => {
      it("are marked, skipped by the arrows, and never toggle", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ disabled: ["two"] });
        trigger("One").focus();

        // Act
        await user.keyboard("{ArrowDown}");
        const focused = document.activeElement;
        await user.click(trigger("Two"));

        // Assert
        expect(trigger("Two").getAttribute("aria-disabled")).toBe("true");
        expect(trigger("One").getAttribute("aria-disabled")).not.toBe("true");
        expect(focused).toBe(trigger("Three"));
        expect(expanded()).toEqual([]);
      });
    });
  });
}
