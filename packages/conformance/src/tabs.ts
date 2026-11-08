/**
 * The Tabs behaviour every Primitiv surface must share, written against the DOM
 * alone: Testing Library role queries and real keyboard and pointer input, never
 * a surface's own API. Each surface runs it with its own `mount`, so a behaviour
 * one surface has and the other lacks fails here (RFC 0033 §6.2, D12).
 *
 * What a surface does *differently on purpose* — React's `asChild` and
 * callbacks, the elements' reflected attributes and DOM events — belongs in that
 * surface's own suite, not here.
 */
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

/** The tabs every fixture renders, in order. */
export const TABS = [
  { value: "one", label: "One", panel: "First panel" },
  { value: "two", label: "Two", panel: "Second panel" },
  { value: "three", label: "Three", panel: "Third panel" },
] as const;

/** Pure data describing one tab set; each surface turns it into its own markup. */
export type TabsConformanceFixture = {
  /** The initially active tab, or none. */
  value?: string;
  orientation?: "horizontal" | "vertical";
  activationMode?: "automatic" | "manual";
  dir?: "ltr" | "rtl";
  disabled?: readonly string[];
  /** The tablist's accessible name. Always "Sections" in these cases. */
  label: string;
};

/**
 * Render `fixture` into `document.body` and resolve once it has settled.
 * Resolves to a cleanup function.
 */
export type TabsMount = (fixture: TabsConformanceFixture) => Promise<() => void>;

const tab = (name: string) => screen.getByRole("tab", { name });

export function runTabsConformance(mount: TabsMount): void {
  let cleanup: (() => void) | undefined;

  const render = async (fixture: Omit<TabsConformanceFixture, "label">) => {
    cleanup = await mount({ label: "Sections", ...fixture });
  };

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  describe("Tabs conformance", () => {
    describe("structure", () => {
      it("renders a named tablist of tabs and shows the active tab's panel", async () => {
        // Arrange & Act
        await render({ value: "two" });

        // Assert
        expect(screen.getByRole("tablist", { name: "Sections" })).toBeDefined();
        expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["One", "Two", "Three"]);
        expect(tab("Two").getAttribute("aria-selected")).toBe("true");
        expect(tab("One").getAttribute("aria-selected")).toBe("false");
        expect(screen.getAllByRole("tabpanel").map((p) => p.textContent)).toEqual(["Second panel"]);
      });

      it("labels the panel by its tab and points the tab at its panel", async () => {
        // Arrange & Act
        await render({ value: "one" });

        // Assert
        const panel = screen.getByRole("tabpanel", { name: "One" });
        expect(tab("One").getAttribute("aria-controls")).toBe(panel.id);
      });

      it("publishes data-state and data-orientation on tabs and panels", async () => {
        // Arrange & Act
        await render({ value: "one", orientation: "vertical" });

        // Assert
        expect(tab("One").getAttribute("data-state")).toBe("active");
        expect(tab("Two").getAttribute("data-state")).toBe("inactive");
        expect(tab("One").getAttribute("data-orientation")).toBe("vertical");
        expect(screen.getByRole("tabpanel").getAttribute("data-state")).toBe("active");
        expect(screen.getByRole("tabpanel").getAttribute("data-orientation")).toBe("vertical");
      });
    });

    describe("the tab stop", () => {
      it("is the active tab only", async () => {
        // Arrange & Act
        await render({ value: "two" });

        // Assert
        expect(screen.getAllByRole("tab").map((t) => t.getAttribute("tabindex"))).toEqual(["-1", "0", "-1"]);
      });

      it("is the first tab while none is active", async () => {
        // Arrange & Act
        await render({});

        // Assert
        expect(screen.getAllByRole("tab").map((t) => t.getAttribute("tabindex"))).toEqual(["0", "-1", "-1"]);
      });
    });

    describe("pointer", () => {
      it("activates a clicked tab", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "one" });

        // Act
        await user.click(tab("Three"));

        // Assert
        expect(tab("Three").getAttribute("aria-selected")).toBe("true");
        expect(screen.getByRole("tabpanel").textContent).toBe("Third panel");
      });
    });

    describe("keyboard", () => {
      it("moves and activates with the arrows, wrapping at the ends", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "one" });
        tab("One").focus();

        // Act
        await user.keyboard("{ArrowLeft}");

        // Assert
        expect(tab("Three")).toBe(document.activeElement);
        expect(tab("Three").getAttribute("aria-selected")).toBe("true");
      });

      it("jumps with Home and End", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "two" });
        tab("Two").focus();

        // Act
        await user.keyboard("{End}");
        const atEnd = document.activeElement;
        await user.keyboard("{Home}");

        // Assert
        expect(atEnd).toBe(tab("Three"));
        expect(tab("One")).toBe(document.activeElement);
        expect(tab("One").getAttribute("aria-selected")).toBe("true");
      });

      it("moves focus only in manual mode, until Enter or Space activates", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "one", activationMode: "manual" });
        tab("One").focus();

        // Act
        await user.keyboard("{ArrowRight}");
        const beforeConfirm = tab("Two").getAttribute("aria-selected");
        await user.keyboard("{Enter}");
        await user.keyboard("{ArrowRight}");
        await user.keyboard(" ");

        // Assert
        expect(beforeConfirm).toBe("false");
        expect(tab("Three")).toBe(document.activeElement);
        expect(tab("Three").getAttribute("aria-selected")).toBe("true");
      });

      it("uses the vertical arrows when vertical", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "one", orientation: "vertical" });
        tab("One").focus();

        // Act
        await user.keyboard("{ArrowRight}{ArrowDown}");

        // Assert
        expect(tab("Two")).toBe(document.activeElement);
        expect(tab("Two").getAttribute("aria-selected")).toBe("true");
      });

      it("mirrors the horizontal arrows right to left", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "one", dir: "rtl" });
        tab("One").focus();

        // Act
        await user.keyboard("{ArrowLeft}");

        // Assert
        expect(tab("Two")).toBe(document.activeElement);
      });
    });

    describe("disabled tabs", () => {
      it("are marked, and land focus without activating", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "one", disabled: ["two"] });
        tab("One").focus();

        // Act
        await user.keyboard("{ArrowRight}");
        await user.click(tab("Two"));

        // Assert
        expect(tab("Two").getAttribute("aria-disabled")).toBe("true");
        expect(tab("One").getAttribute("aria-disabled")).not.toBe("true");
        expect(tab("One").getAttribute("aria-selected")).toBe("true");
        expect(screen.getByRole("tabpanel").textContent).toBe("First panel");
      });
    });
  });
}
