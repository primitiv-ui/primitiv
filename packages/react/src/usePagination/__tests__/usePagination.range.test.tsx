import { describe, expect, it } from "vitest";
import { paginationRange } from "../usePagination.ts";

/** Render a range compactly: pages as numbers, gaps as the pages they hide. */
function shape(items: ReturnType<typeof paginationRange>): string {
  return items
    .map((item) => (item.type === "page" ? String(item.page) : `[${item.pages.join(",")}]`))
    .join(" ");
}

describe("paginationRange", () => {
  it("should list every page when the window is wide enough to cover the range", () => {
    // Note the defaults do NOT show all 5: siblingCount 1 + boundaryCount 1
    // leaves {1,2,5} visible, collapsing [3,4]. Covering a 5-page range takes a
    // wider window — asserted below so the default's tighter shape is a
    // deliberate, visible choice rather than an accident.
    expect(shape(paginationRange(3, 5, 2))).toBe("1 2 3 4 5");
  });

  it("should collapse even a short range at the default window", () => {
    expect(shape(paginationRange(1, 5))).toBe("1 2 [3,4] 5");
  });

  it("should collapse the tail when the current page is near the start", () => {
    expect(shape(paginationRange(2, 10))).toBe("1 2 3 [4,5,6,7,8,9] 10");
  });

  it("should collapse the head when the current page is near the end", () => {
    expect(shape(paginationRange(9, 10))).toBe("1 [2,3,4,5,6,7] 8 9 10");
  });

  it("should collapse both ends when the current page is mid-range", () => {
    const items = paginationRange(50, 100);

    expect(items.map((i) => i.type)).toEqual([
      "page", // 1
      "gap", // 2-48
      "page", // 49
      "page", // 50 (current)
      "page", // 51
      "gap", // 52-99
      "page", // 100
    ]);
  });

  it("should hide exactly the pages between the two shown either side of a gap", () => {
    const items = paginationRange(50, 100);
    const [leading] = items.filter((i) => i.type === "gap");

    // The gap must be contiguous and abut its neighbours — an off-by-one here
    // would silently drop a page from the menu, unreachable anywhere.
    expect(leading).toEqual({
      type: "gap",
      pages: Array.from({ length: 47 }, (_, i) => i + 2),
    });
  });

  it("should show a lone hidden page instead of collapsing it", () => {
    // Hiding one number behind a menu costs a click and saves no width — the
    // ellipsis cell is the same square as the number it would replace.
    expect(shape(paginationRange(1, 5, 1, 2))).toBe("1 2 3 4 5");
  });

  it("should widen the window around the current page with siblingCount", () => {
    expect(shape(paginationRange(50, 100, 2))).toContain("48 49 50 51 52");
  });

  it("should pin more pages at each end with boundaryCount", () => {
    const items = shape(paginationRange(50, 100, 1, 2));

    expect(items.startsWith("1 2 ")).toBe(true);
    expect(items.endsWith(" 99 100")).toBe(true);
  });

  it("should handle a single page without emitting a gap", () => {
    expect(shape(paginationRange(1, 1))).toBe("1");
  });

  it("should not emit pages beyond the range when the count is tiny", () => {
    expect(shape(paginationRange(1, 2, 3, 3))).toBe("1 2");
  });
});
