/**
 * The Slider behaviour every Primitiv surface must share, written against the
 * DOM alone: Testing Library role queries and real keyboard and pointer input,
 * never a surface's own API. Each surface runs it with its own `mount`
 * (RFC 0033 §6.2, D12).
 */
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

/**
 * Pure data describing one slider; each surface turns it into its own markup:
 * a root marked `data-testid="root"`, a track holding a range marked
 * `data-testid="range"`, and one thumb per value, labelled `Thumb 1`, `Thumb 2` ...
 */
export type SliderConformanceFixture = {
  /** One value per thumb. */
  value: readonly number[];
  min?: number;
  max?: number;
  step?: number;
  minStepsBetweenThumbs?: number;
  orientation?: "horizontal" | "vertical";
  dir?: "ltr" | "rtl";
  inverted?: boolean;
  disabled?: boolean;
  /** The form field name; hidden inputs carry the values. */
  name?: string;
};

/** Render `fixture` into `document.body`; resolves to a cleanup function once settled. */
export type SliderMount = (fixture: SliderConformanceFixture) => Promise<() => void>;

/** A track 100px wide and tall at the page's top-left, so a pointer's x (or 100 − y) is its value on 0–100. */
const TRACK = { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0, toJSON: () => ({}) };

const thumb = (n = 1) => screen.getByRole("slider", { name: `Thumb ${n}` });
const now = () => screen.getAllByRole("slider").map((slider) => slider.getAttribute("aria-valuenow"));

export function runSliderConformance(mount: SliderMount): void {
  let cleanup: (() => void) | undefined;

  const render = async (fixture: SliderConformanceFixture) => {
    cleanup = await mount(fixture);
    screen.getByTestId("root").getBoundingClientRect = () => TRACK as DOMRect;
  };

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  describe("Slider conformance", () => {
    describe("structure", () => {
      it("renders each thumb as a slider stating its value and bounds", async () => {
        // Arrange & Act
        await render({ value: [20, 80], min: 10, max: 90 });

        // Assert
        expect(now()).toEqual(["20", "80"]);
        expect(thumb().getAttribute("aria-valuemin")).toBe("10");
        expect(thumb().getAttribute("aria-valuemax")).toBe("90");
        expect(thumb().getAttribute("aria-orientation")).toBe("horizontal");
        expect(thumb().getAttribute("data-orientation")).toBe("horizontal");
        expect(screen.getByTestId("root").getAttribute("data-orientation")).toBe("horizontal");
      });

      it("states a vertical orientation", async () => {
        // Arrange & Act
        await render({ value: [50], orientation: "vertical" });

        // Assert
        expect(thumb().getAttribute("aria-orientation")).toBe("vertical");
        expect(screen.getByTestId("range").getAttribute("data-orientation")).toBe("vertical");
      });

      it("puts every thumb in the Tab order", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: [20, 80] });

        // Act
        await user.tab();
        const first = document.activeElement;
        await user.tab();

        // Assert
        expect(first).toBe(thumb(1));
        expect(document.activeElement).toBe(thumb(2));
      });
    });

    describe("position", () => {
      it("places the thumb and fills the range from the start edge", async () => {
        // Arrange & Act
        await render({ value: [30] });

        // Assert
        expect(thumb().style.left).toBe("30%");
        expect(screen.getByTestId("range").style.left).toBe("0%");
        expect(screen.getByTestId("range").style.right).toBe("70%");
      });

      it("measures from the right in right-to-left, and fills between two thumbs", async () => {
        // Arrange & Act
        await render({ value: [20, 60], dir: "rtl" });

        // Assert
        expect(thumb(2).style.right).toBe("60%");
        expect(screen.getByTestId("range").style.right).toBe("20%");
        expect(screen.getByTestId("range").style.left).toBe("40%");
      });

      it("follows the value as it changes", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: [30], orientation: "vertical" });
        thumb().focus();

        // Act
        await user.keyboard("{PageUp}");

        // Assert
        expect(thumb().style.bottom).toBe("40%");
      });
    });

    describe("keyboard", () => {
      it.each([
        ["{ArrowRight}", "51"],
        ["{ArrowUp}", "51"],
        ["{ArrowLeft}", "49"],
        ["{ArrowDown}", "49"],
        ["{PageUp}", "60"],
        ["{PageDown}", "40"],
        ["{Home}", "0"],
        ["{End}", "100"],
      ])("%s moves 50 to %s", async (key, expected) => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: [50] });
        thumb().focus();

        // Act
        await user.keyboard(key);

        // Assert
        expect(now()).toEqual([expected]);
      });

      it("mirrors the horizontal arrows right to left", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: [50], dir: "rtl" });
        thumb().focus();

        // Act
        await user.keyboard("{ArrowRight}");

        // Assert
        expect(now()).toEqual(["49"]);
      });

      it("keeps a thumb from passing its neighbour", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: [20, 60], minStepsBetweenThumbs: 10, step: 1 });
        thumb(1).focus();

        // Act
        await user.keyboard("{End}");

        // Assert
        expect(now()).toEqual(["50", "60"]);
      });
    });

    describe("pointer", () => {
      it("jumps the nearest thumb to a press, focuses it, and follows the drag", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: [20, 80] });
        const root = screen.getByTestId("root");

        // Act
        await user.pointer({ keys: "[MouseLeft>]", target: root, coords: { clientX: 70, clientY: 50 } });
        const pressed = now();
        await user.pointer({ target: root, coords: { clientX: 64, clientY: 50 } });
        await user.pointer({ keys: "[/MouseLeft]", target: root, coords: { clientX: 64, clientY: 50 } });
        await user.pointer({ target: root, coords: { clientX: 90, clientY: 50 } });

        // Assert
        expect(pressed).toEqual(["20", "70"]);
        expect(document.activeElement).toBe(thumb(2));
        expect(now()).toEqual(["20", "64"]);
      });

      it("reads a vertical press from the bottom", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: [10], orientation: "vertical" });

        // Act
        await user.pointer({ keys: "[MouseLeft>]", target: screen.getByTestId("root"), coords: { clientX: 50, clientY: 75 } });

        // Assert
        expect(now()).toEqual(["25"]);
      });
    });

    describe("disabled", () => {
      it("is marked, leaves the Tab order, and ignores keys and presses", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: [50], disabled: true });

        // Act
        await user.tab();
        const focused = document.activeElement;
        thumb().focus();
        await user.keyboard("{ArrowRight}");
        await user.pointer({ keys: "[MouseLeft>]", target: screen.getByTestId("root"), coords: { clientX: 20, clientY: 50 } });

        // Assert
        expect(focused).not.toBe(thumb());
        expect(thumb().getAttribute("aria-disabled")).toBe("true");
        expect(thumb().hasAttribute("data-disabled")).toBe(true);
        expect(screen.getByTestId("root").hasAttribute("data-disabled")).toBe(true);
        expect(now()).toEqual(["50"]);
      });
    });

    describe("forms", () => {
      it("carries its values in hidden inputs named for it, following a change", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: [20, 80], name: "price" });
        thumb(2).focus();

        // Act
        await user.keyboard("{ArrowRight}");

        // Assert
        const inputs = [...document.querySelectorAll<HTMLInputElement>('input[type="hidden"]')];
        expect(inputs.map((input) => [input.name, input.value])).toEqual([
          ["price[]", "20"],
          ["price[]", "81"],
        ]);
      });

      it("names a single value's input plainly, and carries none without a name", async () => {
        // Arrange & Act
        await render({ value: [40], name: "volume" });
        const named = [...document.querySelectorAll<HTMLInputElement>('input[type="hidden"]')].map((i) => i.name);
        cleanup?.();
        await render({ value: [40] });

        // Assert
        expect(named).toEqual(["volume"]);
        expect(document.querySelectorAll('input[type="hidden"]')).toHaveLength(0);
      });
    });
  });
}
