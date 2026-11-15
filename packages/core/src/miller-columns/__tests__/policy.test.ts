import {
  millerColumnsColumnDepths,
  millerColumnsKeydown,
  millerColumnsResizeDrag,
  millerColumnsResizeKeydown,
  millerColumnsSelect,
  millerColumnsTabStop,
  type MillerColumnsItem,
} from "../policy";

/**
 * docs ▸ guides ▸ (intro, setup)   — the root column holds docs, blog (disabled), readme
 *                                    docs' column holds guides, api
 */
const ITEMS: readonly MillerColumnsItem[] = [
  { depth: 0, value: "docs", disabled: false, hasChildren: true },
  { depth: 0, value: "blog", disabled: true, hasChildren: true },
  { depth: 0, value: "readme", disabled: false, hasChildren: false },
  { depth: 1, value: "guides", disabled: false, hasChildren: true },
  { depth: 1, value: "api", disabled: false, hasChildren: false },
  { depth: 2, value: "intro", disabled: false, hasChildren: false },
];

const state = (path: string[], dir: "ltr" | "rtl" = "ltr") => ({ path, dir, items: ITEMS });

describe("millerColumnsSelect", () => {
  it("keeps the shallower columns, appends the value and drops everything deeper", () => {
    expect(millerColumnsSelect(["docs", "guides", "intro"], 1, "api")).toEqual(["docs", "api"]);
  });

  it("selects at the root of an empty path", () => {
    expect(millerColumnsSelect([], 0, "readme")).toEqual(["readme"]);
  });
});

describe("millerColumnsTabStop", () => {
  it("is the item focus was last on", () => {
    expect(millerColumnsTabStop({ active: { depth: 1, value: "api" }, path: ["docs"], items: ITEMS })).toEqual({
      depth: 1,
      value: "api",
    });
  });

  it("is the deepest selected item before anything is focused", () => {
    expect(millerColumnsTabStop({ active: null, path: ["docs", "guides"], items: ITEMS })).toEqual({
      depth: 1,
      value: "guides",
    });
  });

  it("falls back to the first enabled item of the root column", () => {
    const items = [{ depth: 0, value: "first", disabled: true, hasChildren: false }, ...ITEMS];
    expect(millerColumnsTabStop({ active: null, path: [], items })).toEqual({ depth: 0, value: "docs" });
  });

  it("ignores enabled items in deeper columns, wherever they are listed", () => {
    const items = [{ depth: 1, value: "deep", disabled: false, hasChildren: false }, ...ITEMS];
    expect(millerColumnsTabStop({ active: null, path: [], items })).toEqual({ depth: 0, value: "docs" });
  });

  it("is nothing when the root column has no enabled item", () => {
    const items = [{ depth: 0, value: "only", disabled: true, hasChildren: false }];
    expect(millerColumnsTabStop({ active: null, path: [], items })).toBeNull();
  });
});

describe("millerColumnsKeydown", () => {
  it("moves down and up the focused column, wrapping and skipping disabled items", () => {
    expect(millerColumnsKeydown(state([]), { depth: 0, value: "docs" }, "ArrowDown")).toEqual({
      focus: { depth: 0, value: "readme" },
    });
    expect(millerColumnsKeydown(state([]), { depth: 0, value: "readme" }, "ArrowDown")).toEqual({
      focus: { depth: 0, value: "docs" },
    });
    expect(millerColumnsKeydown(state([]), { depth: 0, value: "docs" }, "ArrowUp")).toEqual({
      focus: { depth: 0, value: "readme" },
    });
  });

  it("stays inside the focused item's own column", () => {
    expect(millerColumnsKeydown(state(["docs"]), { depth: 1, value: "api" }, "ArrowDown")).toEqual({
      focus: { depth: 1, value: "guides" },
    });
  });

  it("jumps to the first and last enabled item with Home and End", () => {
    expect(millerColumnsKeydown(state([]), { depth: 0, value: "readme" }, "Home")).toEqual({
      focus: { depth: 0, value: "docs" },
    });
    expect(millerColumnsKeydown(state([]), { depth: 0, value: "docs" }, "End")).toEqual({
      focus: { depth: 0, value: "readme" },
    });
  });

  it("selects with Enter and Space", () => {
    expect(millerColumnsKeydown(state([]), { depth: 0, value: "readme" }, "Enter")).toEqual({
      select: { depth: 0, value: "readme" },
    });
    expect(millerColumnsKeydown(state([]), { depth: 0, value: "readme" }, " ")).toEqual({
      select: { depth: 0, value: "readme" },
    });
  });

  it("consumes Enter on a disabled item without selecting it", () => {
    expect(millerColumnsKeydown(state([]), { depth: 0, value: "blog" }, "Enter")).toEqual({});
  });

  it("leaves an arrow from a disabled item alone, since it is not in the navigable list", () => {
    expect(millerColumnsKeydown(state([]), { depth: 0, value: "blog" }, "ArrowDown")).toBeNull();
  });

  it("handles no roving key in a column with no enabled item", () => {
    const items = [{ depth: 0, value: "only", disabled: true, hasChildren: false }];
    expect(millerColumnsKeydown({ path: [], dir: "ltr", items }, { depth: 0, value: "only" }, "Enter")).toBeNull();
  });

  it("leaves a key that is not in the keymap to typeahead", () => {
    expect(millerColumnsKeydown(state([]), { depth: 0, value: "docs" }, "r")).toBeNull();
  });

  it("steps into an unselected branch: selects it and focuses its column once it opens", () => {
    expect(millerColumnsKeydown(state([]), { depth: 0, value: "docs" }, "ArrowRight")).toEqual({
      select: { depth: 0, value: "docs" },
      focusColumn: 1,
    });
  });

  it("steps into a selected branch's open column without selecting again", () => {
    expect(millerColumnsKeydown(state(["docs"]), { depth: 0, value: "docs" }, "ArrowRight")).toEqual({
      focusColumn: 1,
    });
  });

  it("does not step into a leaf or a disabled branch", () => {
    expect(millerColumnsKeydown(state([]), { depth: 0, value: "readme" }, "ArrowRight")).toBeNull();
    expect(millerColumnsKeydown(state([]), { depth: 0, value: "blog" }, "ArrowRight")).toBeNull();
  });

  it("steps out to the parent column's selected item, and not out of the root column", () => {
    expect(millerColumnsKeydown(state(["docs", "guides"]), { depth: 2, value: "intro" }, "ArrowLeft")).toEqual({
      focus: { depth: 1, value: "guides" },
    });
    expect(millerColumnsKeydown(state(["docs"]), { depth: 0, value: "docs" }, "ArrowLeft")).toBeNull();
  });

  it("mirrors the step keys right to left", () => {
    expect(millerColumnsKeydown(state([], "rtl"), { depth: 0, value: "docs" }, "ArrowLeft")).toEqual({
      select: { depth: 0, value: "docs" },
      focusColumn: 1,
    });
    expect(millerColumnsKeydown(state(["docs"], "rtl"), { depth: 1, value: "api" }, "ArrowRight")).toEqual({
      focus: { depth: 0, value: "docs" },
    });
    expect(millerColumnsKeydown(state(["docs"], "rtl"), { depth: 1, value: "api" }, "ArrowLeft")).toBeNull();
  });

  it("tells apart two items with one value at different depths", () => {
    const items = [
      { depth: 0, value: "x", disabled: false, hasChildren: false },
      { depth: 1, value: "x", disabled: false, hasChildren: true },
    ];
    expect(millerColumnsKeydown({ path: ["a"], dir: "ltr", items }, { depth: 1, value: "x" }, "ArrowRight")).toEqual({
      select: { depth: 1, value: "x" },
      focusColumn: 2,
    });
  });

  it("leaves a key on an item it does not know alone", () => {
    expect(millerColumnsKeydown(state([]), { depth: 0, value: "ghost" }, "ArrowRight")).toBeNull();
  });
});

describe("millerColumnsColumnDepths", () => {
  // columns in document order, each naming its parent item (null for the root column)
  const COLUMNS = ["docs", null, "guides", "blog"];

  it("places the root column at depth 0 and only it while nothing is selected", () => {
    expect(millerColumnsColumnDepths(COLUMNS, [])).toEqual([null, 0, null, null]);
  });

  it("follows the path: each selected branch's column at the next depth", () => {
    expect(millerColumnsColumnDepths(COLUMNS, ["docs", "guides"])).toEqual([1, 0, 2, null]);
  });

  it("stops at a selected item that has no column of its own", () => {
    expect(millerColumnsColumnDepths(COLUMNS, ["readme", "guides"])).toEqual([null, 0, null, null]);
  });

  it("takes the first column naming a parent, so a duplicate stays out of the strip", () => {
    expect(millerColumnsColumnDepths(["docs", null, "docs", null], ["docs"])).toEqual([1, 0, null, null]);
  });

  it("is all hidden with no root column", () => {
    expect(millerColumnsColumnDepths(["docs"], ["docs"])).toEqual([null]);
  });
});

describe("millerColumnsResizeKeydown", () => {
  const bounds = { width: 200, min: 120, max: 400, step: 10, dir: "ltr" as const };

  it("widens with the inline-end arrow and narrows with the inline-start one", () => {
    expect(millerColumnsResizeKeydown(bounds, "ArrowRight")).toBe(210);
    expect(millerColumnsResizeKeydown(bounds, "ArrowLeft")).toBe(190);
  });

  it("mirrors the arrows right to left", () => {
    expect(millerColumnsResizeKeydown({ ...bounds, dir: "rtl" }, "ArrowLeft")).toBe(210);
    expect(millerColumnsResizeKeydown({ ...bounds, dir: "rtl" }, "ArrowRight")).toBe(190);
  });

  it("jumps to the bounds with Home and End", () => {
    expect(millerColumnsResizeKeydown(bounds, "Home")).toBe(120);
    expect(millerColumnsResizeKeydown(bounds, "End")).toBe(400);
  });

  it("clamps to the bounds", () => {
    expect(millerColumnsResizeKeydown({ ...bounds, width: 395 }, "ArrowRight")).toBe(400);
    expect(millerColumnsResizeKeydown({ ...bounds, width: 125 }, "ArrowLeft")).toBe(120);
  });

  it("does nothing on End while the width is unbounded, nor on any other key", () => {
    expect(millerColumnsResizeKeydown({ ...bounds, max: Number.POSITIVE_INFINITY }, "End")).toBeNull();
    expect(millerColumnsResizeKeydown(bounds, "ArrowUp")).toBeNull();
  });
});

describe("millerColumnsResizeDrag", () => {
  it("adds the pointer's travel to the width the drag started from, clamped", () => {
    expect(millerColumnsResizeDrag({ startWidth: 200, startX: 50, x: 80, min: 120, max: 400 })).toBe(230);
    expect(millerColumnsResizeDrag({ startWidth: 200, startX: 50, x: 500, min: 120, max: 400 })).toBe(400);
    expect(millerColumnsResizeDrag({ startWidth: 200, startX: 50, x: -100, min: 120, max: 400 })).toBe(120);
  });
});
