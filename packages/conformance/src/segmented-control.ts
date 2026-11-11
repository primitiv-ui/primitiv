/**
 * The SegmentedControl behaviour every Primitiv surface must share, written
 * against the DOM alone: Testing Library role queries and real keyboard and
 * pointer input, never a surface's own API. Each surface runs it with its own
 * `mount` (RFC 0033 §6.2, D12).
 */
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

/** The segments every fixture renders, in order. */
export const SEGMENTED_CONTROL_ITEMS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
] as const;

/** Pure data describing one segmented control; each surface turns it into its own markup. */
export type SegmentedControlConformanceFixture = {
  /** The initially selected segment. */
  value?: string;
  orientation?: "horizontal" | "vertical";
  dir?: "ltr" | "rtl";
  /** The values of the disabled segments. */
  disabled?: readonly string[];
  /** Whether the whole control is disabled. */
  controlDisabled?: boolean;
  /** The control's accessible name. Always "Range" in these cases. */
  label: string;
};

/** Render `fixture` into `document.body`; resolves to a cleanup function once settled. */
export type SegmentedControlMount = (fixture: SegmentedControlConformanceFixture) => Promise<() => void>;

const segment = (name: string) => screen.getByRole("radio", { name });
const checked = () =>
  screen
    .getAllByRole("radio")
    .filter((radio) => radio.getAttribute("aria-checked") === "true")
    .map((radio) => radio.textContent);

export function runSegmentedControlConformance(mount: SegmentedControlMount): void {
  let cleanup: (() => void) | undefined;

  const render = async (fixture: Omit<SegmentedControlConformanceFixture, "label"> = {}) => {
    cleanup = await mount({ label: "Range", ...fixture });
  };

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  describe("SegmentedControl conformance", () => {
    describe("structure", () => {
      it("renders a named radio group of segments, checking the one in its value", async () => {
        // Arrange & Act
        await render({ value: "week" });

        // Assert
        const group = screen.getByRole("radiogroup", { name: "Range" });
        expect(screen.getAllByRole("radio").map((r) => r.textContent)).toEqual(["Day", "Week", "Month"]);
        expect(screen.getAllByRole("radio").map((r) => r.getAttribute("aria-checked"))).toEqual([
          "false",
          "true",
          "false",
        ]);
        expect(group.getAttribute("aria-orientation")).toBe("horizontal");
        expect(group.getAttribute("data-orientation")).toBe("horizontal");
      });

      it("publishes data-state on the segments and the orientation on the group", async () => {
        // Arrange & Act
        await render({ value: "month", orientation: "vertical" });

        // Assert
        expect(segment("Month").getAttribute("data-state")).toBe("checked");
        expect(segment("Day").getAttribute("data-state")).toBe("unchecked");
        expect(screen.getByRole("radiogroup").getAttribute("aria-orientation")).toBe("vertical");
        expect(screen.getByRole("radiogroup").getAttribute("data-orientation")).toBe("vertical");
      });

      it("puts only the selected segment in the Tab order", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "week" });

        // Act
        await user.tab();
        const first = document.activeElement;
        await user.tab();

        // Assert
        expect(first).toBe(segment("Week"));
        expect(screen.getAllByRole("radio")).not.toContain(document.activeElement);
      });

      it("puts the first enabled segment in the Tab order while none is selected", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ disabled: ["day"] });

        // Act
        await user.tab();

        // Assert
        expect(document.activeElement).toBe(segment("Week"));
      });
    });

    describe("pointer", () => {
      it("selects a clicked segment, replacing the selection", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "day" });

        // Act
        await user.click(segment("Month"));

        // Assert
        expect(checked()).toEqual(["Month"]);
      });

      it("keeps a segment selected when it is clicked again", async () => {
        // Arrange
        const user = userEvent.setup();
        await render();

        // Act
        await user.click(segment("Week"));
        await user.click(segment("Week"));

        // Assert
        expect(checked()).toEqual(["Week"]);
      });
    });

    describe("keyboard", () => {
      it("moves focus and selection with the arrows, wrapping at the ends", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "day" });
        await user.tab();

        // Act
        await user.keyboard("{ArrowRight}");
        const second = [document.activeElement, checked()];
        await user.keyboard("{ArrowRight}{ArrowRight}");
        const wrapped = [document.activeElement, checked()];
        await user.keyboard("{ArrowLeft}");

        // Assert
        expect(second).toEqual([segment("Week"), ["Week"]]);
        expect(wrapped).toEqual([segment("Day"), ["Day"]]);
        expect(document.activeElement).toBe(segment("Month"));
        expect(checked()).toEqual(["Month"]);
      });

      it("uses the vertical arrows when vertical", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "day", orientation: "vertical" });
        await user.tab();

        // Act
        await user.keyboard("{ArrowRight}");
        const unmoved = checked();
        await user.keyboard("{ArrowDown}");

        // Assert
        expect(unmoved).toEqual(["Day"]);
        expect(document.activeElement).toBe(segment("Week"));
        expect(checked()).toEqual(["Week"]);
      });

      it("mirrors the horizontal arrows right to left", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "day", dir: "rtl" });
        await user.tab();

        // Act
        await user.keyboard("{ArrowLeft}");

        // Assert
        expect(document.activeElement).toBe(segment("Week"));
        expect(checked()).toEqual(["Week"]);
      });
    });

    describe("disabled segments", () => {
      it("are marked, skipped by the arrows, and never selected", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "day", disabled: ["week"] });
        await user.tab();

        // Act
        await user.keyboard("{ArrowRight}");
        const skippedTo = document.activeElement;
        await user.click(segment("Week"));

        // Assert
        expect(segment("Week").hasAttribute("data-disabled")).toBe(true);
        expect(segment("Day").hasAttribute("data-disabled")).toBe(false);
        expect(skippedTo).toBe(segment("Month"));
        expect(checked()).toEqual(["Month"]);
      });
    });

    describe("a disabled control", () => {
      it("marks itself and every segment, keeps its selection, and selects nothing", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "day", controlDisabled: true });

        // Act
        await user.click(segment("Month"));

        // Assert
        expect(screen.getByRole("radiogroup").hasAttribute("data-disabled")).toBe(true);
        expect(screen.getAllByRole("radio").every((radio) => radio.hasAttribute("data-disabled"))).toBe(true);
        expect(checked()).toEqual(["Day"]);
      });
    });
  });
}
