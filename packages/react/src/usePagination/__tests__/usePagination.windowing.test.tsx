import { describe, expect, it } from "vitest";
import { paginationRange } from "../usePagination.ts";

function shape(items: ReturnType<typeof paginationRange>): string {
  return items
    .map((item) => (item.type === "page" ? String(item.page) : `[${item.pages.join(",")}]`))
    .join(" ");
}

describe("paginationRange paged windowing", () => {
  it("should hold the same block of pages steady while the current page moves within it", () => {
    // The whole point: stepping 6 -> 7 -> 8 must not re-label a single cell,
    // only move which one is active. A sliding window re-renders the numbers
    // under the reader's cursor on every step, which reads as a flash.
    const at6 = shape(paginationRange(6, 20, { window: "paged", blockSize: 5 }));
    const at7 = shape(paginationRange(7, 20, { window: "paged", blockSize: 5 }));
    const at8 = shape(paginationRange(8, 20, { window: "paged", blockSize: 5 }));

    expect(at7).toBe(at6);
    expect(at8).toBe(at6);
  });

  it("should show the block containing the current page, plus the boundaries", () => {
    expect(shape(paginationRange(7, 20, { window: "paged", blockSize: 5 }))).toBe(
      "1 [2,3,4,5] 6 7 8 9 10 [11,...,19] 20".replace(
        "11,...,19",
        "11,12,13,14,15,16,17,18,19",
      ),
    );
  });

  it("should advance to the next block when stepping past the block's last page", () => {
    const atLast = shape(paginationRange(10, 20, { window: "paged", blockSize: 5 }));
    const atNext = shape(paginationRange(11, 20, { window: "paged", blockSize: 5 }));

    expect(atLast).toContain("6 7 8 9 10");
    expect(atNext).toContain("11 12 13 14 15");
    expect(atNext).not.toBe(atLast);
  });

  it("should fall back to the previous block when stepping before the block's first page", () => {
    const atFirst = shape(paginationRange(6, 20, { window: "paged", blockSize: 5 }));
    const atPrevious = shape(paginationRange(5, 20, { window: "paged", blockSize: 5 }));

    expect(atFirst).toContain("6 7 8 9 10");
    expect(atPrevious).toContain("1 2 3 4 5");
  });

  it("should not run the final block past the last page", () => {
    // 20 pages at blockSize 5 divides evenly; 22 does not, so the last block
    // holds only 21 and 22.
    expect(shape(paginationRange(21, 22, { window: "paged", blockSize: 5 }))).toContain("21 22");
    expect(shape(paginationRange(21, 22, { window: "paged", blockSize: 5 }))).not.toContain("23");
  });

  it("should still collapse a lone hidden page into a plain page", () => {
    // Block 2-6 with boundary 1: nothing hidden at the head, so no gap.
    expect(shape(paginationRange(3, 12, { window: "paged", blockSize: 5 }))).toBe(
      "1 2 3 4 5 [6,7,8,9,10,11] 12",
    );
  });

  it("should keep sliding behaviour available for consumers who prefer it", () => {
    expect(shape(paginationRange(7, 20, { window: "sliding" }))).toBe(
      "1 [2,3,4,5] 6 7 8 [9,...,19] 20".replace("9,...,19", "9,10,11,12,13,14,15,16,17,18,19"),
    );
  });
});
