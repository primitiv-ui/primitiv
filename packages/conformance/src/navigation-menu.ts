/**
 * The Navigation Menu behaviour every Primitiv surface must share, written
 * against the DOM alone: Testing Library role queries and real keyboard and
 * pointer input, never a surface's own API. Each surface runs it with its own
 * `mount`, so a behaviour one surface has and the other lacks fails here
 * (RFC 0033 §6.2, D12).
 *
 * It is the ARIA APG *Disclosure Navigation Menu*, not a menubar: every
 * top-level entry stays in the Tab order, and the arrows only move focus.
 *
 * What a surface does *differently on purpose* — React's `asChild`,
 * `forceMount` and callbacks, the elements' reflected `value` and DOM events,
 * and how each places a panel in the Viewport — belongs in that surface's own
 * suite, not here.
 */
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

/**
 * The menu every fixture renders, in this order: a "Docs" trigger whose panel
 * holds the "Guides" and "API" links, a "Blog" trigger whose panel holds the
 * "Latest" link, and a plain "Pricing" link entry. A "Search" button follows
 * the nav, outside it. The `value` of each disclosure entry is its key here.
 */
export const NAVIGATION_MENU = {
  entries: [
    { value: "docs", label: "Docs", links: ["Guides", "API"] },
    { value: "blog", label: "Blog", links: ["Latest"] },
  ],
  link: "Pricing",
  outside: "Search",
} as const;

/** Pure data describing one menu; each surface turns it into its own markup. */
export type NavigationMenuConformanceFixture = {
  /** The entry open at first: `"docs"`, `"blog"`, or nothing. */
  value?: "docs" | "blog";
  orientation?: "horizontal" | "vertical";
  /** Render the nav inside a `dir="rtl"` container. */
  rtl?: boolean;
  /** Hover opens a panel. Defaults to `true`, as on both surfaces. */
  openOnHover?: boolean;
  /** The hover-open delay in ms. Defaults to `0` here, so most cases open at once. */
  delay?: number;
  /** The close delay in ms after the pointer leaves the nav. Defaults to `0` here. */
  closeDelay?: number;
  /** Render a Viewport (with `data-testid="viewport"`) that the panels share. */
  viewport?: boolean;
  /** Render an Indicator, with `data-testid="indicator"`. */
  indicator?: boolean;
  /** Mark the "Pricing" link as the current page. */
  active?: boolean;
};

/** What a mount hands back: how to tear it down, and how to let real time pass. */
export type NavigationMenuMounted = {
  cleanup(): void;
  /** Wait `ms` of real time and let the surface apply any timer it ran. */
  wait(ms: number): Promise<void>;
};

/** Render `fixture` into `document.body` and resolve once it has settled. */
export type NavigationMenuMount = (fixture: NavigationMenuConformanceFixture) => Promise<NavigationMenuMounted>;

const trigger = (label: string) => screen.getByRole("button", { name: label });
const link = (name: string) => screen.getByRole("link", { name, hidden: true });
const panelOf = (label: string) =>
  document.getElementById(trigger(label).getAttribute("aria-controls") ?? "") as HTMLElement;
const isOpen = (label: string) => trigger(label).getAttribute("aria-expanded") === "true" && !panelOf(label).hidden;
const isClosed = (label: string) =>
  trigger(label).getAttribute("aria-expanded") === "false" && panelOf(label).hidden;
const testId = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`) as HTMLElement;

export function runNavigationMenuConformance(mount: NavigationMenuMount): void {
  let mounted: NavigationMenuMounted | undefined;

  const render = async (fixture: NavigationMenuConformanceFixture) => {
    mounted = await mount(fixture);
  };
  const wait = (ms: number) => (mounted as NavigationMenuMounted).wait(ms);

  afterEach(() => {
    mounted?.cleanup();
    mounted = undefined;
  });

  describe("NavigationMenu conformance", () => {
    describe("structure", () => {
      it("is a navigation landmark named Main, with its entries in a list", async () => {
        // Arrange & Act
        await render({});

        // Assert
        const nav = screen.getByRole("navigation", { name: "Main" });
        expect(nav.contains(screen.getByRole("list"))).toBe(true);
        expect(screen.getAllByRole("listitem")).toHaveLength(3);
      });

      it("points each trigger at its hidden panel, which it labels", async () => {
        // Arrange & Act
        await render({});

        // Assert
        expect(isClosed("Docs")).toBe(true);
        expect(panelOf("Docs").getAttribute("aria-labelledby")).toBe(trigger("Docs").id);
        expect(panelOf("Docs").textContent).toContain("Guides");
      });

      it("shows the entry it starts open with, and marks the state", async () => {
        // Arrange & Act
        await render({ value: "docs" });

        // Assert
        expect(isOpen("Docs")).toBe(true);
        expect(isClosed("Blog")).toBe(true);
        expect(trigger("Docs").getAttribute("data-state")).toBe("open");
        expect(panelOf("Docs").getAttribute("data-state")).toBe("open");
        expect(panelOf("Blog").getAttribute("data-state")).toBe("closed");
      });

      it("marks the current page's link", async () => {
        // Arrange & Act
        await render({ active: true });

        // Assert
        expect(link("Pricing").getAttribute("aria-current")).toBe("page");
        expect(link("Pricing").hasAttribute("data-active")).toBe(true);
        expect(link("Guides").hasAttribute("aria-current")).toBe(false);
      });
    });

    describe("pointer", () => {
      it("opens on a click, closes on a second, and keeps one panel open at a time", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ openOnHover: false });

        // Act
        await user.click(trigger("Docs"));
        const docsOpened = isOpen("Docs");
        await user.click(trigger("Blog"));
        const switched = isOpen("Blog") && isClosed("Docs");
        await user.click(trigger("Blog"));

        // Assert
        expect(docsOpened).toBe(true);
        expect(switched).toBe(true);
        expect(isClosed("Blog")).toBe(true);
      });

      it("opens on hover once the delay has passed, not before", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ delay: 40 });

        // Act
        await user.hover(trigger("Docs"));
        const early = isClosed("Docs");
        await wait(80);

        // Assert
        expect(early).toBe(true);
        expect(isOpen("Docs")).toBe(true);
      });

      it("keeps the panel hover opened when the same pointer clicks", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ closeDelay: 5000 });

        // Act
        await user.click(trigger("Docs"));

        // Assert
        expect(isOpen("Docs")).toBe(true);
      });

      it("ignores hover when hover-to-open is off", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ openOnHover: false });

        // Act
        await user.hover(trigger("Docs"));
        await wait(20);

        // Assert
        expect(isClosed("Docs")).toBe(true);
      });

      it("closes once the pointer leaves the nav, after the close delay", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "docs", closeDelay: 40 });
        await user.hover(trigger("Docs"));

        // Act
        await user.unhover(screen.getByRole("navigation"));
        const early = isOpen("Docs");
        await wait(80);

        // Assert
        expect(early).toBe(true);
        expect(isClosed("Docs")).toBe(true);
      });

      it("stays open while the pointer travels from the trigger into its panel", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "docs", closeDelay: 20 });

        // Act
        await user.hover(trigger("Docs"));
        await user.hover(link("Guides"));
        await wait(40);

        // Assert
        expect(isOpen("Docs")).toBe(true);
      });

      it("closes the open panel when the pointer reaches a plain link entry", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "docs" });

        // Act
        await user.hover(link("Pricing"));

        // Assert
        expect(isClosed("Docs")).toBe(true);
      });

      it("closes the open panel when one of its links is followed", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "docs", openOnHover: false });

        // Act
        await user.click(link("Guides"));

        // Assert
        expect(isClosed("Docs")).toBe(true);
      });
    });

    describe("keyboard", () => {
      it("keeps every top-level entry in the Tab order", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});

        // Act
        const visited: Array<Element | null> = [];
        for (let i = 0; i < 3; i++) {
          await user.tab();
          visited.push(document.activeElement);
        }

        // Assert
        expect(visited).toEqual([trigger("Docs"), trigger("Blog"), link("Pricing")]);
      });

      it("toggles a panel with Enter and Space", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        trigger("Docs").focus();

        // Act
        await user.keyboard("{Enter}");
        const afterEnter = isOpen("Docs");
        await user.keyboard(" ");

        // Assert
        expect(afterEnter).toBe(true);
        expect(isClosed("Docs")).toBe(true);
      });

      it("travels the bar with the arrows, wrapping, and jumps with Home and End", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        trigger("Docs").focus();

        // Act
        await user.keyboard("{ArrowRight}");
        const second = document.activeElement;
        await user.keyboard("{End}");
        const last = document.activeElement;
        await user.keyboard("{ArrowRight}");
        const wrapped = document.activeElement;
        await user.keyboard("{ArrowLeft}");
        const back = document.activeElement;
        await user.keyboard("{Home}");

        // Assert
        expect(second).toBe(trigger("Blog"));
        expect(last).toBe(link("Pricing"));
        expect(wrapped).toBe(trigger("Docs"));
        expect(back).toBe(link("Pricing"));
        expect(document.activeElement).toBe(trigger("Docs"));
        expect(isClosed("Docs")).toBe(true);
      });

      it("mirrors the arrows under RTL", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ rtl: true });
        trigger("Docs").focus();

        // Act
        await user.keyboard("{ArrowLeft}");

        // Assert
        expect(document.activeElement).toBe(trigger("Blog"));
      });

      it("travels a vertical rail with the vertical arrows, and enters a panel sideways", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ orientation: "vertical" });
        trigger("Docs").focus();

        // Act
        await user.keyboard("{ArrowDown}");
        const travelled = document.activeElement;
        await user.keyboard("{ArrowRight}");

        // Assert
        expect(travelled).toBe(trigger("Blog"));
        expect(isOpen("Blog")).toBe(true);
        expect(document.activeElement).toBe(link("Latest"));
      });

      it("opens a panel with ArrowDown and moves focus to its first link", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        trigger("Docs").focus();

        // Act
        await user.keyboard("{ArrowDown}");

        // Assert
        expect(isOpen("Docs")).toBe(true);
        expect(document.activeElement).toBe(link("Guides"));
      });

      it("moves into an already-open panel with ArrowDown", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "docs" });
        trigger("Docs").focus();

        // Act
        await user.keyboard("{ArrowDown}");

        // Assert
        expect(document.activeElement).toBe(link("Guides"));
      });

      it("closes with Escape from inside a panel and hands focus back to its trigger", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "docs" });
        link("API").focus();

        // Act
        await user.keyboard("{Escape}");

        // Assert
        expect(isClosed("Docs")).toBe(true);
        expect(document.activeElement).toBe(trigger("Docs"));
      });

      it("closes when focus leaves the nav", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "docs" });
        link("Pricing").focus();

        // Act
        await user.tab();

        // Assert
        expect(document.activeElement).toBe(screen.getByRole("button", { name: NAVIGATION_MENU.outside }));
        expect(isClosed("Docs")).toBe(true);
      });

      it("stays open while focus moves within the nav", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "docs" });
        link("Guides").focus();

        // Act
        await user.tab();

        // Assert
        expect(document.activeElement).toBe(link("API"));
        expect(isOpen("Docs")).toBe(true);
      });
    });

    describe("viewport and indicator", () => {
      it("shares one viewport between the panels, marked with the open entry", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ viewport: true, openOnHover: false });
        const viewport = testId("viewport");
        const closed = viewport.hidden && viewport.getAttribute("data-state") === "closed";

        // Act
        await user.click(trigger("Blog"));

        // Assert
        expect(closed).toBe(true);
        expect(viewport.contains(panelOf("Docs"))).toBe(true);
        expect(viewport.contains(panelOf("Blog"))).toBe(true);
        expect(viewport.hidden).toBe(false);
        expect(viewport.getAttribute("data-state")).toBe("open");
        expect(viewport.getAttribute("data-value")).toBe("blog");
      });

      it("tells a panel which way it travels as the open entry changes", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: "docs", openOnHover: false });

        // Act
        await user.click(trigger("Blog"));

        // Assert
        expect(panelOf("Blog").getAttribute("data-motion")).toBe("from-end");
        expect(panelOf("Docs").getAttribute("data-motion")).toBe("to-start");
      });

      it("shows the indicator only while a panel is open, with the open trigger's geometry", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ indicator: true, openOnHover: false });
        const indicator = testId("indicator");
        const closed = indicator.hidden;

        // Act
        await user.click(trigger("Docs"));

        // Assert
        expect(closed).toBe(true);
        expect(indicator.hidden).toBe(false);
        expect(indicator.getAttribute("data-state")).toBe("open");
        expect(indicator.getAttribute("data-value")).toBe("docs");
        expect(indicator.style.getPropertyValue("--primitiv-navigation-menu-indicator-position")).toBe("0px");
        expect(indicator.style.getPropertyValue("--primitiv-navigation-menu-indicator-size")).toBe("0px");
      });
    });
  });
}
