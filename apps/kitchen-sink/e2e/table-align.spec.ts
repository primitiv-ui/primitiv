import { test, expect } from "@playwright/test";

/*
 * Real-browser proof for column alignment on Table
 * (docs/interface-audit.md, `better-typography`: `table` had no numeric-column
 * affordance).
 *
 * What was actually wrong is subtler than "no support": `DataTableSortHeader`
 * accepted an `align` documented as "`end` for numeric columns", but forwarded it
 * only to the sort *button* (`justify-content`), never to the `<th>`. So following
 * the documentation right-aligned the header and left every `<td>` at the leading
 * edge. Both halves individually "worked"; they just disagreed.
 *
 * The assertion is therefore AGREEMENT between each column's header and its own
 * cells — checked across every column rather than at hardcoded indices, so it
 * keeps testing the invariant when the demo's columns change.
 *
 * Measured on computed `text-align`, which Chromium reports as the LOGICAL keyword
 * (`start` / `end`), not a resolved `left` / `right` — worth knowing before writing
 * an assertion against a physical value, as an earlier version of this did.
 *
 * Run: cd apps/kitchen-sink && ./node_modules/.bin/playwright test --project=chromium
 */

test.describe("Table column alignment", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.goto("/");
    await page.locator(".primitiv-data-table").first().waitFor();
  });

  test("every column's header agrees with its own cells", async ({ page }) => {
    const columns = await page.evaluate(() => {
      const table = document.querySelector(".primitiv-data-table .primitiv-table");
      if (!table) throw new Error("no data-table found");
      const headers = [...table.querySelectorAll("thead th")];
      // Only rows with a full complement of cells: the expandable detail rows hold
      // a single colspan cell, so indexing into them yields undefined.
      const rows = [...table.querySelectorAll("tbody tr")]
        .map((row) => row.querySelectorAll("td"))
        .filter((tds) => tds.length === headers.length);
      return headers.map((header, i) => ({
        label: (header.textContent ?? "").trim().slice(0, 24),
        header: getComputedStyle(header).textAlign,
        cells: [...new Set(rows.map((tds) => getComputedStyle(tds[i]).textAlign))],
      }));
    });

    expect(columns.length).toBeGreaterThan(1);
    for (const { label, header, cells } of columns) {
      expect(cells, `column "${label}" cells disagree with each other`).toHaveLength(1);
      expect(header, `column "${label}" header vs its cells`).toBe(cells[0]);
    }

    // Non-vacuous: at least one column must actually be end-aligned, or this would
    // pass just as happily on a table where nothing was aligned at all — which is
    // exactly the state before the fix.
    expect(columns.some((c) => c.header === "end")).toBe(true);
  });
});
