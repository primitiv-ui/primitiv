/**
 * The ToggleGroup behaviour every Primitiv surface must share, written against
 * the DOM alone: Testing Library role queries and real keyboard and pointer
 * input, never a surface's own API. Each surface runs it with its own `mount`
 * (RFC 0033 §6.2, D12).
 */
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

/** The items every fixture renders, in order. */
export const TOGGLE_GROUP_ITEMS = [
  { value: "bold", label: "Bold" },
  { value: "italic", label: "Italic" },
  { value: "underline", label: "Underline" },
] as const;

/** Pure data describing one toggle group; each surface turns it into its own markup. */
export type ToggleGroupConformanceFixture = {
  type: "single" | "multiple";
  /** The initially pressed items. */
  value?: readonly string[];
  orientation?: "horizontal" | "vertical";
  dir?: "ltr" | "rtl";
  disabled?: readonly string[];
  /** The group's accessible name. Always "Formatting" in these cases. */
  label: string;
};

/** Render `fixture` into `document.body`; resolves to a cleanup function once settled. */
export type ToggleGroupMount = (fixture: ToggleGroupConformanceFixture) => Promise<() => void>;

const item = (name: string) => screen.getByRole("button", { name });
const pressed = () =>
  screen
    .getAllByRole("button")
    .filter((button) => button.getAttribute("aria-pressed") === "true")
    .map((button) => button.textContent);

export function runToggleGroupConformance(mount: ToggleGroupMount): void {
  let cleanup: (() => void) | undefined;

  const render = async (fixture: Omit<ToggleGroupConformanceFixture, "label">) => {
    cleanup = await mount({ label: "Formatting", ...fixture });
  };

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  describe("ToggleGroup conformance", () => {
    describe("structure", () => {
      it("renders a named group of toggle buttons, pressing the items in its value", async () => {
        // Arrange & Act
        await render({ type: "multiple", value: ["bold", "underline"] });

        // Assert
        const group = screen.getByRole("group", { name: "Formatting" });
        expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["Bold", "Italic", "Underline"]);
        expect(screen.getAllByRole("button").map((b) => b.getAttribute("aria-pressed"))).toEqual([
          "true",
          "false",
          "true",
        ]);
        expect(group.getAttribute("data-orientation")).toBe("horizontal");
      });

      it("publishes data-state on the items and data-orientation on the group", async () => {
        // Arrange & Act
        await render({ type: "single", value: ["italic"], orientation: "vertical" });

        // Assert
        expect(item("Italic").getAttribute("data-state")).toBe("on");
        expect(item("Bold").getAttribute("data-state")).toBe("off");
        expect(screen.getByRole("group").getAttribute("data-orientation")).toBe("vertical");
      });

      it("puts only the first pressed item in the Tab order", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "multiple", value: ["italic", "underline"] });

        // Act
        await user.tab();
        const first = document.activeElement;
        await user.tab();

        // Assert
        expect(first).toBe(item("Italic"));
        expect(screen.getAllByRole("button")).not.toContain(document.activeElement);
      });

      it("puts the first item in the Tab order while nothing is pressed", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "single" });

        // Act
        await user.tab();

        // Assert
        expect(document.activeElement).toBe(item("Bold"));
      });
    });

    describe("pointer", () => {
      it("presses a clicked item and lets go on a second click", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "single" });

        // Act
        await user.click(item("Italic"));
        const once = pressed();
        await user.click(item("Italic"));

        // Assert
        expect(once).toEqual(["Italic"]);
        expect(pressed()).toEqual([]);
      });

      it("lets go of the pressed item when another is pressed, in single mode", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "single", value: ["bold"] });

        // Act
        await user.click(item("Underline"));

        // Assert
        expect(pressed()).toEqual(["Underline"]);
      });

      it("keeps several items pressed in multiple mode", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "multiple", value: ["bold"] });

        // Act
        await user.click(item("Underline"));

        // Assert
        expect(pressed()).toEqual(["Bold", "Underline"]);
      });
    });

    describe("keyboard", () => {
      it("moves focus with the arrows, wrapping at the ends, without pressing", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "single" });
        await user.tab();

        // Act
        await user.keyboard("{ArrowRight}");
        const second = document.activeElement;
        await user.keyboard("{ArrowRight}{ArrowRight}");
        const wrapped = document.activeElement;
        await user.keyboard("{ArrowLeft}");

        // Assert
        expect(second).toBe(item("Italic"));
        expect(wrapped).toBe(item("Bold"));
        expect(document.activeElement).toBe(item("Underline"));
        expect(pressed()).toEqual([]);
      });

      it("jumps with Home and End", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "single" });
        await user.tab();

        // Act
        await user.keyboard("{End}");
        const last = document.activeElement;
        await user.keyboard("{Home}");

        // Assert
        expect(last).toBe(item("Underline"));
        expect(document.activeElement).toBe(item("Bold"));
      });

      it("toggles the focused item with Enter and Space", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "multiple" });
        await user.tab();

        // Act
        await user.keyboard("{Enter}");
        const entered = pressed();
        await user.keyboard("{ArrowRight} ");

        // Assert
        expect(entered).toEqual(["Bold"]);
        expect(pressed()).toEqual(["Bold", "Italic"]);
      });

      it("keeps the tab stop on the item focus last moved to", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "single", value: ["bold"] });
        await user.tab();
        await user.keyboard("{ArrowRight}");

        // Act
        await user.tab({ shift: true });
        await user.tab();

        // Assert
        expect(document.activeElement).toBe(item("Italic"));
      });

      it("uses the vertical arrows when vertical", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "single", orientation: "vertical" });
        await user.tab();

        // Act
        await user.keyboard("{ArrowRight}");
        const unmoved = document.activeElement;
        await user.keyboard("{ArrowDown}");

        // Assert
        expect(unmoved).toBe(item("Bold"));
        expect(document.activeElement).toBe(item("Italic"));
      });

      it("mirrors the horizontal arrows right to left", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "single", dir: "rtl" });
        await user.tab();

        // Act
        await user.keyboard("{ArrowLeft}");

        // Assert
        expect(document.activeElement).toBe(item("Italic"));
      });
    });

    describe("disabled items", () => {
      it("are marked, skipped by the arrows, and never pressed", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ type: "single", disabled: ["italic"] });
        await user.tab();

        // Act
        await user.keyboard("{ArrowRight}");
        const skippedTo = document.activeElement;
        await user.click(item("Italic"));

        // Assert
        expect(item("Italic").hasAttribute("data-disabled")).toBe(true);
        expect(item("Bold").hasAttribute("data-disabled")).toBe(false);
        expect(skippedTo).toBe(item("Underline"));
        expect(pressed()).toEqual([]);
      });
    });
  });
}
