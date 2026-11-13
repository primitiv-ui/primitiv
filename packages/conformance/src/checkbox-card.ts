/**
 * The CheckboxCard behaviour every Primitiv surface must share, written against
 * the DOM alone: Testing Library role queries and real keyboard and pointer
 * input, never a surface's own API. Each surface runs it with its own `mount`
 * (RFC 0033 §6.2, D12).
 */
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

/** The card's visible label, which names it. */
export const CHECKBOX_CARD_LABEL = "Email updates";

/** Pure data describing one checkbox card holding an indicator; each surface turns it into its own markup. */
export type CheckboxCardConformanceFixture = {
  /** The initial state; unchecked when omitted. */
  checked?: boolean | "indeterminate";
  disabled?: boolean;
  /** Whether the indicator stays rendered while unchecked. */
  forceMount?: boolean;
  /** Submit the card with the surrounding form under this name. */
  name?: string;
  /** What it submits while checked; `"on"` when omitted, as a native checkbox. */
  value?: string;
};

/** Render `fixture` inside a `<form>` in `document.body`; resolves to a cleanup function once settled. */
export type CheckboxCardMount = (fixture: CheckboxCardConformanceFixture) => Promise<() => void>;

const card = () => screen.getByRole("checkbox", { name: CHECKBOX_CARD_LABEL });
/** The card's rendered indicator: decorative, and not hidden. */
/** What the surrounding form would submit, as name/value pairs. */
const submitted = () => [...new FormData(document.querySelector("form") as HTMLFormElement).entries()];
const indicator = () => card().querySelector<HTMLElement>('[aria-hidden="true"]:not([hidden])');

export function runCheckboxCardConformance(mount: CheckboxCardMount): void {
  let cleanup: (() => void) | undefined;

  const render = async (fixture: CheckboxCardConformanceFixture = {}) => {
    cleanup = await mount(fixture);
  };

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  describe("CheckboxCard conformance", () => {
    describe("structure", () => {
      it.each([
        [undefined, "false", "unchecked"],
        [true, "true", "checked"],
        ["indeterminate", "mixed", "indeterminate"],
      ] as const)("renders a card in state %j as a checkbox named by its content", async (checked, aria, state) => {
        // Arrange & Act
        await render({ checked });

        // Assert
        expect(card().getAttribute("aria-checked")).toBe(aria);
        expect(card().getAttribute("data-state")).toBe(state);
        expect(card().hasAttribute("data-disabled")).toBe(false);
      });
    });

    describe("toggling", () => {
      it("checks and unchecks on a click", async () => {
        // Arrange
        const user = userEvent.setup();
        await render();

        // Act
        await user.click(card());
        const once = card().getAttribute("aria-checked");
        await user.click(card());

        // Assert
        expect(once).toBe("true");
        expect(card().getAttribute("aria-checked")).toBe("false");
      });

      it("resolves a mixed card to checked", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ checked: "indeterminate" });

        // Act
        await user.click(card());

        // Assert
        expect(card().getAttribute("aria-checked")).toBe("true");
      });

      it("toggles once with Space and once with Enter", async () => {
        // Arrange
        const user = userEvent.setup();
        await render();
        await user.tab();

        // Act
        await user.keyboard(" ");
        const spaced = card().getAttribute("aria-checked");
        await user.keyboard("{Enter}");

        // Assert
        expect(document.activeElement).toBe(card());
        expect(spaced).toBe("true");
        expect(card().getAttribute("aria-checked")).toBe("false");
      });
    });

    describe("disabled", () => {
      it("is marked and never toggles", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ disabled: true });

        // Act
        await user.click(card());

        // Assert
        expect(card().hasAttribute("data-disabled")).toBe(true);
        expect(card().getAttribute("aria-checked")).toBe("false");
      });
    });

    describe("indicator", () => {
      it("shows while checked or mixed, and follows a click", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ checked: "indeterminate" });
        const mixed = indicator()?.getAttribute("data-state");

        // Act
        await user.click(card());
        const checked = indicator()?.getAttribute("data-state");
        await user.click(card());

        // Assert
        expect(mixed).toBe("indeterminate");
        expect(checked).toBe("checked");
        expect(indicator()).toBeNull();
      });

      it("stays while unchecked when force-mounted", async () => {
        // Arrange & Act
        await render({ forceMount: true });

        // Assert
        expect(indicator()?.getAttribute("data-state")).toBe("unchecked");
      });
    });

    describe("forms", () => {
      it("submits its value under its name while checked, and follows the toggle", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ checked: true, name: "updates", value: "weekly" });
        const before = submitted();

        // Act
        await user.click(card());

        // Assert
        expect(before).toEqual([["updates", "weekly"]]);
        expect(submitted()).toEqual([]);
      });

      it("submits \"on\" when it has no value, as a native checkbox does", async () => {
        // Arrange & Act
        await render({ checked: true, name: "updates" });

        // Assert
        expect(submitted()).toEqual([["updates", "on"]]);
      });

      it.each([
        ["without a name", { checked: true }],
        ["while indeterminate", { checked: "indeterminate", name: "updates" }],
        ["while disabled", { checked: true, disabled: true, name: "updates" }],
      ] as const)("submits nothing %s", async (_, fixture) => {
        // Arrange & Act
        await render(fixture);

        // Assert
        expect(submitted()).toEqual([]);
      });
    });
  });
}
