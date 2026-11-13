/**
 * The RadioCard behaviour every Primitiv surface must share, written against
 * the DOM alone: Testing Library role queries and real keyboard and pointer
 * input, never a surface's own API. Each surface runs it with its own `mount`
 * (RFC 0033 §6.2, D12).
 */
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

/** The cards every fixture renders, in order. Each holds an indicator. */
export const RADIO_CARD_ITEMS = [
  { value: "basic", label: "Basic" },
  { value: "pro", label: "Pro" },
  { value: "team", label: "Team" },
] as const;

/** Pure data describing one group of radio cards; each surface turns it into its own markup. */
export type RadioCardConformanceFixture = {
  /** The initially selected card. */
  value?: string;
  /** Omitted for the default, `"both"`. */
  orientation?: "horizontal" | "vertical";
  dir?: "ltr" | "rtl";
  /** The values of the disabled cards. */
  disabled?: readonly string[];
  /** Whether every card's indicator stays rendered while unchecked. */
  forceMount?: boolean;
  /** Submit the value with the surrounding form under this name. */
  name?: string;
  /** The group's accessible name. Always "Plan" in these cases. */
  label: string;
};

/** Render `fixture` inside a `<form>` in `document.body`; resolves to a cleanup function once settled. */
export type RadioCardMount = (fixture: RadioCardConformanceFixture) => Promise<() => void>;

const card = (name: string) => screen.getByRole("radio", { name });
const checked = () =>
  screen
    .getAllByRole("radio")
    .filter((radio) => radio.getAttribute("aria-checked") === "true")
    .map((radio) => radio.textContent);
/** A card's rendered indicator: decorative, and not hidden. */
const indicator = (radio: HTMLElement) => radio.querySelector<HTMLElement>('[aria-hidden="true"]:not([hidden])');

/** What the surrounding form would submit, as name/value pairs. */
const submitted = () => [...new FormData(document.querySelector("form") as HTMLFormElement).entries()];

export function runRadioCardConformance(mount: RadioCardMount): void {
  let cleanup: (() => void) | undefined;

  const render = async (fixture: Omit<RadioCardConformanceFixture, "label"> = {}) => {
    cleanup = await mount({ label: "Plan", ...fixture });
  };

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  describe("RadioCard conformance", () => {
    describe("structure", () => {
      it("renders a named radio group of cards, checking the one in its value", async () => {
        // Arrange & Act
        await render({ value: "pro" });

        // Assert
        const group = screen.getByRole("radiogroup", { name: "Plan" });
        expect(screen.getAllByRole("radio").map((r) => r.textContent)).toEqual(["Basic", "Pro", "Team"]);
        expect(screen.getAllByRole("radio").map((r) => r.getAttribute("aria-checked"))).toEqual([
          "false",
          "true",
          "false",
        ]);
        expect(card("Pro").getAttribute("data-state")).toBe("checked");
        expect(card("Basic").getAttribute("data-state")).toBe("unchecked");
        expect(group.hasAttribute("aria-orientation")).toBe(false);
      });

      it("states its orientation once it keeps to one axis", async () => {
        // Arrange & Act
        await render({ orientation: "vertical" });

        // Assert
        expect(screen.getByRole("radiogroup").getAttribute("aria-orientation")).toBe("vertical");
      });

      it("puts only the selected card in the Tab order", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "team" });

        // Act
        await user.tab();
        const first = document.activeElement;
        await user.tab();

        // Assert
        expect(first).toBe(card("Team"));
        expect(screen.getAllByRole("radio")).not.toContain(document.activeElement);
      });

      it("puts the first enabled card in the Tab order while none is selected", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ disabled: ["basic"] });

        // Act
        await user.tab();

        // Assert
        expect(document.activeElement).toBe(card("Pro"));
      });
    });

    describe("indicator", () => {
      it("shows only in the checked card, and follows the selection", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "basic" });
        const before = screen.getAllByRole("radio").map((radio) => indicator(radio) !== null);

        // Act
        await user.click(card("Team"));

        // Assert
        expect(before).toEqual([true, false, false]);
        expect(screen.getAllByRole("radio").map((radio) => indicator(radio) !== null)).toEqual([false, false, true]);
        expect(indicator(card("Team"))?.getAttribute("data-state")).toBe("checked");
      });

      it("stays in every card when force-mounted, its data-state following the card", async () => {
        // Arrange & Act
        await render({ value: "pro", forceMount: true });

        // Assert
        expect(screen.getAllByRole("radio").map((radio) => indicator(radio)?.getAttribute("data-state"))).toEqual([
          "unchecked",
          "checked",
          "unchecked",
        ]);
      });
    });

    describe("pointer", () => {
      it("selects a clicked card, and keeps it selected when clicked again", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "basic" });

        // Act
        await user.click(card("Pro"));
        await user.click(card("Pro"));

        // Assert
        expect(checked()).toEqual(["Pro"]);
      });
    });

    describe("keyboard", () => {
      it("moves focus and selection with all four arrows, wrapping at the ends", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "basic" });
        await user.tab();

        // Act
        await user.keyboard("{ArrowDown}");
        const down = [document.activeElement, checked()];
        await user.keyboard("{ArrowRight}");
        const right = checked();
        await user.keyboard("{ArrowRight}");
        const wrapped = checked();
        await user.keyboard("{ArrowUp}");

        // Assert
        expect(down).toEqual([card("Pro"), ["Pro"]]);
        expect(right).toEqual(["Team"]);
        expect(wrapped).toEqual(["Basic"]);
        expect(document.activeElement).toBe(card("Team"));
        expect(checked()).toEqual(["Team"]);
      });

      it("keeps to the vertical arrows when vertical", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "basic", orientation: "vertical" });
        await user.tab();

        // Act
        await user.keyboard("{ArrowRight}");
        const unmoved = checked();
        await user.keyboard("{ArrowDown}");

        // Assert
        expect(unmoved).toEqual(["Basic"]);
        expect(checked()).toEqual(["Pro"]);
      });

      it("mirrors the horizontal arrows right to left", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "basic", dir: "rtl" });
        await user.tab();

        // Act
        await user.keyboard("{ArrowLeft}");

        // Assert
        expect(document.activeElement).toBe(card("Pro"));
        expect(checked()).toEqual(["Pro"]);
      });
    });

    describe("disabled cards", () => {
      it("are marked, skipped by the arrows, and never selected", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "basic", disabled: ["pro"] });
        await user.tab();

        // Act
        await user.keyboard("{ArrowRight}");
        const skippedTo = document.activeElement;
        await user.click(card("Pro"));

        // Assert
        expect(card("Pro").hasAttribute("data-disabled")).toBe(true);
        expect(card("Basic").hasAttribute("data-disabled")).toBe(false);
        expect(skippedTo).toBe(card("Team"));
        expect(checked()).toEqual(["Team"]);
      });
    });

    describe("forms", () => {
      it("submits the selected value under its name, and follows the selection", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "basic", name: "plan" });
        const before = submitted();

        // Act
        await user.click(screen.getByRole("radio", { name: "Team" }));

        // Assert
        expect(before).toEqual([["plan", "basic"]]);
        expect(submitted()).toEqual([["plan", "team"]]);
      });

      it("submits nothing without a name, or while nothing is selected", async () => {
        // Arrange & Act
        await render({ value: "basic" });
        const unnamed = submitted();
        cleanup?.();
        await render({ name: "plan" });

        // Assert
        expect(unnamed).toEqual([]);
        expect(submitted()).toEqual([]);
      });
    });
  });
}
