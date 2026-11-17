/**
 * The Carousel behaviour every Primitiv surface must share, written against the
 * DOM alone: Testing Library role queries and real keyboard and pointer input,
 * never a surface's own API. Each surface runs it with its own `mount`, so a
 * behaviour one surface has and the other lacks fails here (RFC 0033 §6.2, D12).
 *
 * What a surface does *differently on purpose* — React's `asChild`, `ids`,
 * translations and callbacks, the elements' reflected attributes, label
 * templates and DOM events — belongs in that surface's own suite, not here.
 * So does anything that needs layout (scroll positions, the infinite loop's
 * transform) or timers (autoplay), which jsdom and user-event cannot drive.
 */
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

/** The names every fixture renders. */
export const CAROUSEL = {
  label: "Featured",
  previous: "Previous",
  next: "Next",
  indicators: "Choose slide",
  /** The text of slide `n` (one-based). */
  slide: (n: number): string => `Slide content ${n}`,
} as const;

/** Pure data describing one carousel; each surface turns it into its own markup. */
export type CarouselConformanceFixture = {
  /** How many slides. Default 3. */
  slides?: number;
  /** The page it starts on. Default 0. */
  page?: number;
  loop?: boolean;
  orientation?: "horizontal" | "vertical";
  slidesPerPage?: number;
  /** Render the auto indicators, labelled {@link CAROUSEL}.indicators. */
  indicators?: boolean;
  /** Turn autoplay on and render the play / pause control. */
  autoplay?: boolean;
  /** Put a text field in the first slide, labelled "Field". */
  field?: boolean;
};

/**
 * Render `fixture` into `document.body` and resolve once it has settled.
 * Resolves to a cleanup function.
 */
export type CarouselMount = (fixture: CarouselConformanceFixture) => Promise<() => void>;

const region = () => screen.getByRole("region", { name: CAROUSEL.label });
const slides = () => screen.getAllByRole("group").filter((group) => group.getAttribute("aria-roledescription") === "slide");
const active = () => slides().flatMap((slide, index) => (slide.getAttribute("data-state") === "active" ? [index] : []));
const previous = () => screen.getByRole("button", { name: CAROUSEL.previous }) as HTMLButtonElement;
const next = () => screen.getByRole("button", { name: CAROUSEL.next }) as HTMLButtonElement;
const indicator = (n: number) => screen.getByRole("button", { name: `Slide ${n}` });
/** The focusable live region the slides sit in. */
const viewport = () => slides()[0]?.closest("[aria-live]") as HTMLElement;

export function runCarouselConformance(mount: CarouselMount): void {
  let cleanup: (() => void) | undefined;

  const render = async (fixture: CarouselConformanceFixture) => {
    cleanup = await mount(fixture);
  };

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  describe("Carousel conformance", () => {
    describe("structure", () => {
      it("is a region described as a carousel, with each slide a group named for its position", async () => {
        // Arrange & Act
        await render({});

        // Assert
        expect(region().getAttribute("aria-roledescription")).toBe("carousel");
        expect(slides().map((slide) => slide.getAttribute("aria-label"))).toEqual(["1 of 3", "2 of 3", "3 of 3"]);
        expect(slides().map((slide) => slide.textContent)).toEqual([1, 2, 3].map(CAROUSEL.slide));
      });

      it("marks the first page active, and keeps the slides in a focusable polite live region", async () => {
        // Arrange & Act
        await render({});

        // Assert
        expect(active()).toEqual([0]);
        expect(viewport().getAttribute("aria-live")).toBe("polite");
        expect(viewport().tabIndex).toBe(0);
      });

      it("starts on the page it is given", async () => {
        // Arrange & Act
        await render({ page: 2 });

        // Assert
        expect(active()).toEqual([2]);
      });

      it("disables previous at the first page and next at the last", async () => {
        // Arrange & Act
        await render({});

        // Assert
        expect(previous().disabled).toBe(true);
        expect(next().disabled).toBe(false);
      });

      it("names one indicator per page, the active one disabled for assistive technology", async () => {
        // Arrange & Act
        await render({ indicators: true });

        // Assert
        expect(screen.getByRole("group", { name: CAROUSEL.indicators })).toBeDefined();
        expect([1, 2, 3].map((n) => indicator(n).getAttribute("aria-disabled"))).toEqual(["true", "false", "false"]);
        expect(indicator(1).getAttribute("data-state")).toBe("active");
      });

      it("shows a window of slides per page, with one indicator per page", async () => {
        // Arrange & Act
        await render({ slides: 5, slidesPerPage: 2, indicators: true });

        // Assert
        expect(active()).toEqual([0, 1]);
        expect(screen.getAllByRole("button", { name: /^Slide \d$/ })).toHaveLength(3);
      });
    });

    describe("pointer", () => {
      it("pages forward and back with the triggers", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ indicators: true });

        // Act
        await user.click(next());

        // Assert
        expect(active()).toEqual([1]);
        expect(previous().disabled).toBe(false);
        expect(indicator(2).getAttribute("aria-disabled")).toBe("true");

        // Act
        await user.click(previous());

        // Assert
        expect(active()).toEqual([0]);
      });

      it("disables next at the last page", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});

        // Act
        await user.click(next());
        await user.click(next());

        // Assert
        expect(active()).toEqual([2]);
        expect(next().disabled).toBe(true);
      });

      it("jumps to an indicator's page", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ indicators: true });

        // Act
        await user.click(indicator(3));

        // Assert
        expect(active()).toEqual([2]);
      });

      it("wraps past either end while looping", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ loop: true });

        // Assert
        expect(previous().disabled).toBe(false);

        // Act
        await user.click(previous());

        // Assert
        expect(active()).toEqual([2]);

        // Act
        await user.click(next());

        // Assert
        expect(active()).toEqual([0]);
      });

      it("advances a whole page at a time", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ slides: 5, slidesPerPage: 2 });

        // Act
        await user.click(next());

        // Assert
        expect(active()).toEqual([2, 3]);

        // Act — the last page end-aligns, so it is always full.
        await user.click(next());

        // Assert
        expect(active()).toEqual([3, 4]);
        expect(next().disabled).toBe(true);
      });
    });

    describe("keyboard", () => {
      it("pages with the arrow keys and jumps with Home and End on the focused viewport", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        viewport().focus();

        // Act & Assert
        await user.keyboard("{ArrowRight}");
        expect(active()).toEqual([1]);
        await user.keyboard("{End}");
        expect(active()).toEqual([2]);
        await user.keyboard("{ArrowRight}");
        expect(active()).toEqual([2]);
        await user.keyboard("{ArrowLeft}");
        expect(active()).toEqual([1]);
        await user.keyboard("{Home}");
        expect(active()).toEqual([0]);
      });

      it("pages with the up and down arrows when vertical", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ orientation: "vertical" });
        viewport().focus();

        // Act
        await user.keyboard("{ArrowRight}");

        // Assert
        expect(active()).toEqual([0]);

        // Act
        await user.keyboard("{ArrowDown}");

        // Assert
        expect(active()).toEqual([1]);

        // Act
        await user.keyboard("{ArrowUp}");

        // Assert
        expect(active()).toEqual([0]);
      });

      it("leaves the arrow keys to a field inside a slide", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ field: true });

        // Act
        await user.click(screen.getByRole("textbox", { name: "Field" }));
        await user.keyboard("{ArrowRight}");

        // Assert
        expect(active()).toEqual([0]);
      });

      it("reaches the viewport by Tab", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});

        // Act
        await user.tab();

        // Assert
        expect(document.activeElement).toBe(viewport());
      });
    });

    describe("autoplay", () => {
      it("names the play control for what it will do, and silences the live region while playing", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ autoplay: true });
        const control = screen.getByRole("button", { name: "Start automatic slide show" });

        // Assert
        expect(control.getAttribute("data-state")).toBe("paused");

        // Act
        await user.click(control);

        // Assert
        expect(screen.getByRole("button", { name: "Stop automatic slide show" }).getAttribute("data-state")).toBe("playing");
        expect(viewport().getAttribute("aria-live")).toBe("off");

        // Act
        await user.click(screen.getByRole("button", { name: "Stop automatic slide show" }));

        // Assert
        expect(viewport().getAttribute("aria-live")).toBe("polite");
      });
    });
  });
}
