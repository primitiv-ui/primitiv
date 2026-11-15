/**
 * The expandable-row behaviour every Primitiv surface must share, written
 * against the DOM alone: Testing Library role queries and real keyboard and
 * pointer input, never a surface's own API. Each surface runs it with its own
 * `mount`, so a behaviour one surface has and the other lacks fails here
 * (RFC 0033 §6.2, D12).
 *
 * What a surface does *differently on purpose* — React's `Table.Expandable`
 * context and generated ids, the elements' `aria-controls` written in the
 * markup, the reflected `expanded` attribute and the DOM event — belongs in
 * that surface's own suite, not here.
 */
import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

/**
 * The table every fixture renders: two data rows, Ada and Grace, each followed
 * by its detail row. Each row's expand trigger is a button named
 * "Show details for <name>", and each detail row's text is "<name>'s details".
 */
export const TABLE_EXPAND_ROWS = ["Ada", "Grace"] as const;

/** Pure data describing one table; each surface turns it into its own markup. */
export type TableExpandConformanceFixture = {
  /** The rows expanded at first. */
  expanded?: readonly string[];
  /** Keep collapsed detail rows rendered (aria-hidden rather than hidden). */
  forceMount?: boolean;
};

/** Render `fixture` into `document.body` and resolve once it has settled. Resolves to a cleanup. */
export type TableExpandMount = (fixture: TableExpandConformanceFixture) => Promise<() => void>;

const trigger = (name: string) => screen.getByRole("button", { name: `Show details for ${name}` });
/** The detail row, found by its text whether or not it is in the accessibility tree. */
const detail = (name: string) => screen.getByText(`${name}'s details`).closest("tr") as HTMLElement;

export function runTableExpandConformance(mount: TableExpandMount): void {
  let cleanup: (() => void) | undefined;

  const render = async (fixture: TableExpandConformanceFixture = {}) => {
    cleanup = await mount(fixture);
  };

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  describe("Table expandable rows conformance", () => {
    it("wires each trigger to its own detail row, collapsed and out of the row count", async () => {
      // Arrange & Act
      await render();

      // Assert
      expect(trigger("Ada").getAttribute("aria-expanded")).toBe("false");
      expect(trigger("Ada").getAttribute("aria-controls")).toBe(detail("Ada").id);
      expect(trigger("Grace").getAttribute("aria-controls")).toBe(detail("Grace").id);
      expect(detail("Ada").id).not.toBe(detail("Grace").id);
      expect(detail("Ada").hidden).toBe(true);
      expect(trigger("Ada").getAttribute("data-state")).toBe("closed");
      expect(detail("Ada").getAttribute("data-state")).toBe("closed");
      expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(2);
    });

    it("opens a row's detail on click, and closes it again", async () => {
      // Arrange
      const user = userEvent.setup();
      await render();

      // Act
      await user.click(trigger("Ada"));

      // Assert
      expect(trigger("Ada").getAttribute("aria-expanded")).toBe("true");
      expect(trigger("Ada").getAttribute("data-state")).toBe("open");
      expect(detail("Ada").hidden).toBe(false);
      expect(detail("Ada").getAttribute("data-state")).toBe("open");
      expect(detail("Grace").hidden).toBe(true);

      // Act
      await user.click(trigger("Ada"));

      // Assert
      expect(trigger("Ada").getAttribute("aria-expanded")).toBe("false");
      expect(detail("Ada").hidden).toBe(true);
    });

    it("toggles exactly once on Enter and on Space", async () => {
      // Arrange
      const user = userEvent.setup();
      await render();
      trigger("Grace").focus();

      // Act
      await user.keyboard("{Enter}");

      // Assert
      expect(trigger("Grace").getAttribute("aria-expanded")).toBe("true");

      // Act
      await user.keyboard(" ");

      // Assert
      expect(trigger("Grace").getAttribute("aria-expanded")).toBe("false");
    });

    it("starts with the rows it is given expanded", async () => {
      // Arrange & Act
      await render({ expanded: ["Grace"] });

      // Assert
      expect(trigger("Grace").getAttribute("aria-expanded")).toBe("true");
      expect(detail("Grace").hidden).toBe(false);
      expect(detail("Ada").hidden).toBe(true);
    });

    it("keeps a force-mounted detail row rendered but aria-hidden while collapsed", async () => {
      // Arrange
      const user = userEvent.setup();
      await render({ forceMount: true });

      // Assert
      expect(detail("Ada").hidden).toBe(false);
      expect(detail("Ada").getAttribute("aria-hidden")).toBe("true");

      // Act
      await user.click(trigger("Ada"));

      // Assert
      expect(detail("Ada").hasAttribute("aria-hidden")).toBe(false);
    });
  });
}
