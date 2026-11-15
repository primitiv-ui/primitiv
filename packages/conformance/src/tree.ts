/**
 * The Tree behaviour every Primitiv surface must share, written against the
 * DOM alone: Testing Library role queries and real keyboard and pointer input,
 * never a surface's own API. Each surface runs it with its own `mount`, so a
 * behaviour one surface has and the other lacks fails here (RFC 0033 §6.2, D12).
 *
 * What a surface does *differently on purpose* — React's `asChild`,
 * `forceMount` and callbacks, the elements' reflected attributes and DOM
 * events, and how each hides a collapsed group (React unmounts it, the
 * elements set `hidden`) — belongs in that surface's own suite, not here.
 */
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

/**
 * The tree every fixture renders, each node's `label` matching its text:
 *
 * - Docs (branch)
 *   - Guides (branch)
 *     - Intro
 *     - Setup
 *   - API
 * - Blog
 *
 * The values are the labels in lower case. A "Search" button follows the tree.
 */
export const TREE = { outside: "Search" } as const;

/** Pure data describing one tree; each surface turns it into its own markup. */
export type TreeConformanceFixture = {
  /** The branches expanded at first. */
  expanded?: string[];
  /** The values selected at first. */
  selected?: string[];
  multiple?: boolean;
  /** Values to render disabled. */
  disabled?: string[];
  /** Render a selection path after the tree. */
  selectionPath?: boolean;
};

/** Render `fixture` into `document.body` and resolve once it has settled. Resolves to a cleanup. */
export type TreeMount = (fixture: TreeConformanceFixture) => Promise<() => void>;

const item = (name: string) => screen.getByRole("treeitem", { name });
const visible = () => screen.getAllByRole("treeitem").map((node) => node.getAttribute("aria-level") + ":" + name(node));
const name = (node: HTMLElement) => {
  const label = node.getAttribute("aria-labelledby");
  return (label ? document.getElementById(label)?.textContent : node.textContent)?.trim();
};
const selected = () =>
  screen
    .getAllByRole("treeitem")
    .filter((node) => node.getAttribute("aria-selected") === "true")
    .map(name);
const stops = () =>
  screen
    .getAllByRole("treeitem")
    .filter((node) => node.tabIndex === 0)
    .map(name);
const path = () => document.querySelector<HTMLElement>("[data-tree-selection-path]") as HTMLElement;
const segments = () => [...path().querySelectorAll("[data-tree-selection-segment]")].map((s) => s.textContent);

export function runTreeConformance(mount: TreeMount): void {
  let cleanup: (() => void) | undefined;

  const render = async (fixture: TreeConformanceFixture) => {
    cleanup = await mount(fixture);
  };

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  describe("Tree conformance", () => {
    describe("structure", () => {
      it("is a tree whose collapsed branches show only the top level", async () => {
        // Arrange & Act
        await render({});

        // Assert
        expect(screen.getByRole("tree")).toBeTruthy();
        expect(visible()).toEqual(["1:Docs", "1:Blog"]);
        expect(item("Docs").getAttribute("aria-expanded")).toBe("false");
        expect(item("Blog").hasAttribute("aria-expanded")).toBe(false);
      });

      it("shows the children of expanded branches, a level deeper, in a group", async () => {
        // Arrange & Act
        await render({ expanded: ["docs", "guides"] });

        // Assert
        expect(visible()).toEqual(["1:Docs", "2:Guides", "3:Intro", "3:Setup", "2:API", "1:Blog"]);
        expect(item("Docs").getAttribute("aria-expanded")).toBe("true");
        expect(screen.getAllByRole("group")).toHaveLength(2);
      });

      it("puts exactly one item in the Tab order: the first", async () => {
        // Arrange & Act
        await render({ expanded: ["docs"] });

        // Assert
        expect(stops()).toEqual(["Docs"]);
      });

      it("marks the items it starts with selected, and only them", async () => {
        // Arrange & Act
        await render({ expanded: ["docs"], selected: ["api"] });

        // Assert
        expect(selected()).toEqual(["API"]);
        expect(item("Docs").getAttribute("aria-selected")).toBe("false");
        expect(screen.getByRole("tree").hasAttribute("aria-multiselectable")).toBe(false);
      });

      it("is multiselectable in multiple mode", async () => {
        // Arrange & Act
        await render({ multiple: true, selected: ["docs", "blog"] });

        // Assert
        expect(screen.getByRole("tree").getAttribute("aria-multiselectable")).toBe("true");
        expect(selected()).toEqual(["Docs", "Blog"]);
      });

      it("marks a disabled item", async () => {
        // Arrange & Act
        await render({ disabled: ["blog"] });

        // Assert
        expect(item("Blog").getAttribute("aria-disabled")).toBe("true");
        expect(item("Docs").hasAttribute("aria-disabled")).toBe(false);
      });
    });

    describe("pointer", () => {
      it("selects a leaf on a click, replacing the selection", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ selected: ["docs"] });

        // Act
        await user.click(item("Blog"));

        // Assert
        expect(selected()).toEqual(["Blog"]);
      });

      it("toggles and selects a branch on a click of its row", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});

        // Act
        await user.click(screen.getByText("Docs"));
        const opened = visible();
        await user.click(screen.getByText("Docs"));

        // Assert
        expect(opened).toEqual(["1:Docs", "2:Guides", "2:API", "1:Blog"]);
        expect(visible()).toEqual(["1:Docs", "1:Blog"]);
        expect(selected()).toEqual(["Docs"]);
      });

      it("selects the visible range with Shift, and adds with Ctrl, in multiple mode", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ multiple: true, expanded: ["docs", "guides"] });

        // Act
        await user.click(item("Intro"));
        await user.keyboard("{Shift>}");
        await user.click(item("API"));
        await user.keyboard("{/Shift}");
        const range = selected();
        await user.keyboard("{Control>}");
        await user.click(item("Blog"));
        await user.keyboard("{/Control}");

        // Assert
        expect(range).toEqual(["Intro", "Setup", "API"]);
        expect(selected()).toEqual(["Intro", "Setup", "API", "Blog"]);
      });

      it("never selects a disabled item", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ disabled: ["blog"] });

        // Act
        await user.click(item("Blog"));

        // Assert
        expect(selected()).toEqual([]);
      });
    });

    describe("keyboard", () => {
      it("moves through the visible items with the arrows, Home and End, the tab stop following", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ expanded: ["docs"] });
        await user.tab();

        // Act
        await user.keyboard("{ArrowDown}");
        const down = document.activeElement;
        await user.keyboard("{End}");
        const end = document.activeElement;
        await user.keyboard("{ArrowDown}");
        const wrapped = document.activeElement;
        await user.keyboard("{Home}{ArrowUp}");

        // Assert
        expect(down).toBe(item("Guides"));
        expect(end).toBe(item("Blog"));
        expect(wrapped).toBe(item("Docs"));
        expect(document.activeElement).toBe(item("Blog"));
        expect(stops()).toEqual(["Blog"]);
      });

      it("skips a disabled item with the arrows", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ expanded: ["docs"], disabled: ["guides"] });
        await user.tab();

        // Act
        await user.keyboard("{ArrowDown}");

        // Assert
        expect(document.activeElement).toBe(item("API"));
      });

      it("expands with ArrowRight, then moves to the first child", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        await user.tab();

        // Act
        await user.keyboard("{ArrowRight}");
        const expanded = item("Docs").getAttribute("aria-expanded");
        await user.keyboard("{ArrowRight}");

        // Assert
        expect(expanded).toBe("true");
        expect(document.activeElement).toBe(item("Guides"));
      });

      it("moves to the parent with ArrowLeft, then collapses it", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ expanded: ["docs", "guides"] });
        item("Intro").focus();

        // Act
        await user.keyboard("{ArrowLeft}");
        const parent = document.activeElement;
        await user.keyboard("{ArrowLeft}");

        // Assert
        expect(parent).toBe(item("Guides"));
        expect(item("Guides").getAttribute("aria-expanded")).toBe("false");
      });

      it("leaves a key a child does not handle to the child, not its branch", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ expanded: ["docs"], disabled: ["api"] });
        item("API").focus();

        // Act
        await user.keyboard("{ArrowRight}{ArrowLeft}");

        // Assert
        expect(document.activeElement).toBe(item("API"));
        expect(item("Docs").getAttribute("aria-expanded")).toBe("true");
      });

      it("selects with Enter and Space, a branch toggling as it is selected", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({});
        item("Blog").focus();

        // Act
        await user.keyboard(" ");
        const leaf = selected();
        item("Docs").focus();
        await user.keyboard("{Enter}");

        // Assert
        expect(leaf).toEqual(["Blog"]);
        expect(selected()).toEqual(["Docs"]);
        expect(item("Docs").getAttribute("aria-expanded")).toBe("true");
      });
    });

    describe("selection path", () => {
      it("shows the selected item's ancestry, the item itself the current one", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ expanded: ["docs", "guides"], selectionPath: true });
        const empty = path().hasAttribute("data-empty");

        // Act
        await user.click(item("Setup"));

        // Assert
        expect(empty).toBe(true);
        expect(path().hasAttribute("data-empty")).toBe(false);
        expect(segments()).toEqual(["Docs", "Guides", "Setup"]);
        expect(path().querySelector('[aria-current="page"]')?.textContent).toBe("Setup");
      });

      it("shows one trail per selected item in multiple mode", async () => {
        // Arrange & Act
        await render({ multiple: true, expanded: ["docs"], selected: ["api", "blog"], selectionPath: true });

        // Assert
        expect(segments()).toEqual(["Docs", "API", "Blog"]);
        expect(path().querySelectorAll('[aria-current="page"]')).toHaveLength(2);
      });
    });
  });
}
