/**
 * The Miller Columns behaviour every Primitiv surface must share, written
 * against the DOM alone: Testing Library role queries and real keyboard and
 * pointer input, never a surface's own API. Each surface runs it with its own
 * `mount`, so a behaviour one surface has and the other lacks fails here
 * (RFC 0033 §6.2, D12).
 *
 * What a surface does *differently on purpose* — React's nested authoring,
 * `asChild` and callbacks, the elements' sibling columns, reflected attributes
 * and DOM events, and how each takes a column out of the strip (React
 * unmounts it, the elements set `hidden`) — belongs in that surface's own
 * suite, not here.
 */
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

/**
 * The tree every fixture renders, each item's text its label and its value
 * the label in lower case. A branch carries an item indicator.
 *
 * - Docs (branch)
 *   - Guides (branch)
 *     - Intro
 *     - Setup
 *   - API
 * - Blog (branch)
 *   - Post
 * - Readme
 *
 * The tree is named "Files". The preview panel's text is "Preview", and the
 * root column's resize handle is named "Resize column", with a 120px floor,
 * a 400px ceiling and a 10px step.
 */
export const MILLER_COLUMNS = { label: "Files", preview: "Preview", handle: "Resize column" } as const;

/** Pure data describing one strip; each surface turns it into its own markup. */
export type MillerColumnsConformanceFixture = {
  /** The active path at first. */
  value?: string[];
  /** Values to render disabled. */
  disabled?: string[];
  dir?: "ltr" | "rtl";
  /** Render a preview panel after the tree. */
  preview?: boolean;
  /** Render a resize handle in the root column. */
  resize?: boolean;
};

/** Render `fixture` into `document.body` and resolve once it has settled. Resolves to a cleanup. */
export type MillerColumnsMount = (fixture: MillerColumnsConformanceFixture) => Promise<() => void>;

const item = (name: string) => screen.getByRole("treeitem", { name });
const names = (nodes: HTMLElement[]) => nodes.map((node) => node.textContent?.replace("▸", "").trim());
const columns = () => screen.getAllByRole("group").map((group) => names([...group.querySelectorAll<HTMLElement>('[role="treeitem"]')]));
const selected = () => names(screen.getAllByRole("treeitem").filter((node) => node.getAttribute("aria-selected") === "true"));
const stops = () => names(screen.getAllByRole("treeitem").filter((node) => node.tabIndex === 0));
const shown = (text: string) => {
  const node = screen.queryByText(text);
  return node !== null && node.closest("[hidden]") === null;
};

export function runMillerColumnsConformance(mount: MillerColumnsMount): void {
  let cleanup: (() => void) | undefined;

  const render = async (fixture: MillerColumnsConformanceFixture = {}) => {
    cleanup = await mount(fixture);
  };

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  describe("Miller Columns conformance", () => {
    describe("structure", () => {
      it("renders a named tree holding only the root column while nothing is selected", async () => {
        // Arrange & Act
        await render();

        // Assert
        expect(screen.getByRole("tree", { name: MILLER_COLUMNS.label })).toBeTruthy();
        expect(columns()).toEqual([["Docs", "Blog", "Readme"]]);
        expect(item("Docs").getAttribute("aria-level")).toBe("1");
        expect(item("Docs").getAttribute("aria-expanded")).toBe("false");
        expect(item("Readme").hasAttribute("aria-expanded")).toBe(false);
      });

      it("opens a column per selected branch and marks the path, its deepest item terminal", async () => {
        // Arrange & Act
        await render({ value: ["docs", "guides"] });

        // Assert
        expect(columns()).toEqual([["Docs", "Blog", "Readme"], ["Guides", "API"], ["Intro", "Setup"]]);
        expect(selected()).toEqual(["Docs", "Guides"]);
        expect(item("Docs").getAttribute("aria-expanded")).toBe("true");
        expect(item("Docs").getAttribute("data-state")).toBe("selected");
        expect(item("Docs").hasAttribute("data-terminal")).toBe(false);
        expect(item("Guides").hasAttribute("data-terminal")).toBe(true);
        expect(item("Intro").getAttribute("aria-level")).toBe("3");
        expect(item("Intro").getAttribute("data-state")).toBe("unselected");
      });
    });

    describe("selection", () => {
      it("selects a clicked branch, opening its column", async () => {
        // Arrange
        const user = userEvent.setup();
        await render();

        // Act
        await user.click(item("Docs"));

        // Assert
        expect(columns()).toEqual([["Docs", "Blog", "Readme"], ["Guides", "API"]]);
        expect(item("Docs").getAttribute("aria-expanded")).toBe("true");
      });

      it("closes every deeper column when a shallower item is selected", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: ["docs", "guides"] });

        // Act
        await user.click(item("Readme"));

        // Assert
        expect(columns()).toEqual([["Docs", "Blog", "Readme"]]);
        expect(selected()).toEqual(["Readme"]);
      });

      it("never selects a disabled item, which stays in the column", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ disabled: ["blog"] });

        // Act
        await user.click(item("Blog"));

        // Assert
        expect(item("Blog").getAttribute("aria-disabled")).toBe("true");
        expect(selected()).toEqual([]);
        expect(columns()).toHaveLength(1);
      });
    });

    describe("tab stop", () => {
      it("is the first enabled root item while nothing is selected", async () => {
        // Arrange & Act
        await render({ disabled: ["docs"] });

        // Assert
        expect(stops()).toEqual(["Blog"]);
      });

      it("is the deepest selected item, then follows focus", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: ["docs", "guides"] });
        expect(stops()).toEqual(["Guides"]);

        // Act
        await user.click(item("Intro"));

        // Assert
        expect(stops()).toEqual(["Intro"]);
      });
    });

    describe("keyboard", () => {
      it("moves within the focused column, wrapping and skipping disabled items", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ disabled: ["blog"] });
        item("Docs").focus();

        // Act & Assert
        await user.keyboard("{ArrowDown}");
        expect(document.activeElement).toBe(item("Readme"));
        await user.keyboard("{ArrowDown}");
        expect(document.activeElement).toBe(item("Docs"));
        await user.keyboard("{ArrowUp}");
        expect(document.activeElement).toBe(item("Readme"));
        await user.keyboard("{Home}");
        expect(document.activeElement).toBe(item("Docs"));
        await user.keyboard("{End}");
        expect(document.activeElement).toBe(item("Readme"));
      });

      it("selects with Enter and Space", async () => {
        // Arrange
        const user = userEvent.setup();
        await render();
        item("Readme").focus();

        // Act
        await user.keyboard("{Enter}");

        // Assert
        expect(selected()).toEqual(["Readme"]);

        // Act
        item("Docs").focus();
        await user.keyboard(" ");

        // Assert
        expect(selected()).toEqual(["Docs"]);
      });

      it("steps into a branch's column with ArrowRight and back out with ArrowLeft", async () => {
        // Arrange
        const user = userEvent.setup();
        await render();
        item("Docs").focus();

        // Act
        await user.keyboard("{ArrowRight}");

        // Assert
        expect(selected()).toEqual(["Docs"]);
        expect(document.activeElement).toBe(item("Guides"));

        // Act
        await user.keyboard("{ArrowRight}{ArrowRight}");

        // Assert
        expect(document.activeElement).toBe(item("Intro"));

        // Act
        await user.keyboard("{ArrowLeft}");

        // Assert
        expect(document.activeElement).toBe(item("Guides"));
      });

      it("does not step into a leaf", async () => {
        // Arrange
        const user = userEvent.setup();
        await render();
        item("Readme").focus();

        // Act
        await user.keyboard("{ArrowRight}");

        // Assert
        expect(selected()).toEqual([]);
        expect(document.activeElement).toBe(item("Readme"));
      });

      it("mirrors the step keys right to left", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ dir: "rtl" });
        item("Docs").focus();

        // Act
        await user.keyboard("{ArrowLeft}");

        // Assert
        expect(document.activeElement).toBe(item("Guides"));

        // Act
        await user.keyboard("{ArrowRight}");

        // Assert
        expect(document.activeElement).toBe(item("Docs"));
      });

      it("moves to the item a typed prefix matches, within the focused column", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ value: ["docs"] });
        item("Docs").focus();

        // Act
        await user.keyboard("r");

        // Assert
        expect(document.activeElement).toBe(item("Readme"));
      });
    });

    describe("preview panel", () => {
      it("is shown only while the deepest selected item is a leaf", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ preview: true });
        expect(shown(MILLER_COLUMNS.preview)).toBe(false);

        // Act
        await user.click(item("Docs"));

        // Assert
        expect(shown(MILLER_COLUMNS.preview)).toBe(false);

        // Act
        await user.click(item("API"));

        // Assert
        expect(shown(MILLER_COLUMNS.preview)).toBe(true);
      });
    });

    describe("resize handle", () => {
      it("is a named, focusable window splitter whose keys resize its column within bounds", async () => {
        // Arrange
        const user = userEvent.setup();
        await render({ resize: true });
        const handle = screen.getByRole("separator", { name: MILLER_COLUMNS.handle });
        expect(handle.getAttribute("aria-orientation")).toBe("vertical");
        expect(handle.getAttribute("aria-valuemin")).toBe("120");
        expect(handle.getAttribute("aria-valuemax")).toBe("400");
        handle.focus();

        // Act & Assert
        await user.keyboard("{Home}");
        expect(handle.getAttribute("aria-valuenow")).toBe("120");
        await user.keyboard("{ArrowRight}");
        expect(handle.getAttribute("aria-valuenow")).toBe("130");
        await user.keyboard("{End}");
        expect(handle.getAttribute("aria-valuenow")).toBe("400");
        expect(screen.getAllByRole("group")[0].style.width).toBe("400px");
      });
    });
  });
}
