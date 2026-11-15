import { treeKeydown, treePath, treeSelect, treeTabStop, treeToggle, treeVisibleOrder, type TreeKeyState, type TreeNode, type TreeSelectState } from "../policy";

/** docs (branch: guides (branch: intro), api), blog — in registration order, children first. */
const NODES: TreeNode[] = [
  { value: "intro", parent: "guides", isBranch: false, disabled: false },
  { value: "guides", parent: "docs", isBranch: true, disabled: false },
  { value: "api", parent: "docs", isBranch: false, disabled: false },
  { value: "docs", parent: null, isBranch: true, disabled: false },
  { value: "blog", parent: null, isBranch: false, disabled: false },
];

describe("treeVisibleOrder", () => {
  it("lists only the top level while nothing is expanded", () => {
    // Arrange & Act & Assert
    expect(treeVisibleOrder(NODES, [])).toEqual(["docs", "blog"]);
  });

  it("walks depth-first into expanded branches, whatever order the nodes arrived in", () => {
    // Arrange & Act & Assert
    expect(treeVisibleOrder(NODES, ["docs", "guides"])).toEqual(["docs", "guides", "intro", "api", "blog"]);
  });

  it("hides the children of an expanded branch under a collapsed one", () => {
    // Arrange & Act & Assert
    expect(treeVisibleOrder(NODES, ["guides"])).toEqual(["docs", "blog"]);
  });

  it("is empty for no nodes, and an expanded branch with no children adds nothing", () => {
    // Arrange
    const empty: TreeNode[] = [{ value: "empty", parent: null, isBranch: true, disabled: false }];

    // Act & Assert
    expect(treeVisibleOrder([], [])).toEqual([]);
    expect(treeVisibleOrder(empty, ["empty"])).toEqual(["empty"]);
  });

  it("never descends into a leaf, even one named as expanded", () => {
    // Arrange
    const nodes: TreeNode[] = [
      { value: "leaf", parent: null, isBranch: false, disabled: false },
      { value: "orphan", parent: "leaf", isBranch: false, disabled: false },
    ];

    // Act & Assert
    expect(treeVisibleOrder(nodes, ["leaf"])).toEqual(["leaf"]);
  });
});

describe("treePath", () => {
  const byValue = new Map(NODES.map((node) => [node.value, node]));
  const lookup = (value: string) => byValue.get(value);

  it("walks from the root down to the value", () => {
    // Arrange & Act & Assert
    expect(treePath(lookup, "intro").map((node) => node.value)).toEqual(["docs", "guides", "intro"]);
  });

  it("is just the value at the top level", () => {
    // Arrange & Act & Assert
    expect(treePath(lookup, "blog")).toEqual([byValue.get("blog")]);
  });

  it("is empty when the value, or any ancestor, is unknown", () => {
    // Arrange
    const orphan = (value: string) =>
      value === "child" ? { value, parent: "gone", isBranch: false, disabled: false } : undefined;

    // Act & Assert
    expect(treePath(lookup, "missing")).toEqual([]);
    expect(treePath(orphan, "child")).toEqual([]);
  });

  it("stops after 64 hops rather than looping on a parent cycle", () => {
    // Arrange
    const cycle = (value: string) => ({ value, parent: value === "a" ? "b" : "a", isBranch: true, disabled: false });

    // Act
    const path = treePath(cycle, "a");

    // Assert
    expect(path).toHaveLength(64);
  });
});

describe("treeTabStop", () => {
  const order = ["docs", "guides", "blog"];

  it("is the item focus was last on, while it is visible", () => {
    // Arrange & Act & Assert
    expect(treeTabStop({ order, disabled: new Set(), active: "guides" })).toBe("guides");
  });

  it("falls back to the first enabled visible item once the active one is hidden", () => {
    // Arrange & Act & Assert
    expect(treeTabStop({ order, disabled: new Set(["docs"]), active: "intro" })).toBe("guides");
  });

  it("is the first enabled item with no active one, and nothing when every item is disabled", () => {
    // Arrange & Act & Assert
    expect(treeTabStop({ order, disabled: new Set(), active: null })).toBe("docs");
    expect(treeTabStop({ order, disabled: new Set(order), active: null })).toBeNull();
  });
});

describe("treeToggle", () => {
  it("expands a collapsed branch by adding it at the end", () => {
    // Arrange & Act & Assert
    expect(treeToggle(["docs"], "guides")).toEqual(["docs", "guides"]);
  });

  it("collapses an expanded branch, keeping the rest in order", () => {
    // Arrange & Act & Assert
    expect(treeToggle(["docs", "guides", "api"], "guides")).toEqual(["docs", "api"]);
  });
});

describe("treeSelect", () => {
  const order = ["docs", "guides", "intro", "api", "blog"];
  const single: TreeSelectState = { mode: "single", selected: [], anchor: null, order, disabled: new Set() };
  const multiple: TreeSelectState = { ...single, mode: "multiple" };

  it("selects one value in single mode, anchoring there", () => {
    // Arrange & Act & Assert
    expect(treeSelect({ ...single, selected: ["docs"] }, "api")).toEqual({ selected: ["api"], anchor: "api" });
  });

  it("changes nothing when the value is already selected in single mode, modifiers or not", () => {
    // Arrange & Act & Assert
    expect(treeSelect({ ...single, selected: ["api"] }, "api", { shift: true })).toBeNull();
  });

  it("replaces a multiple selection on a plain click, and ignores a click on the sole selected value", () => {
    // Arrange & Act & Assert
    expect(treeSelect({ ...multiple, selected: ["docs", "api"] }, "api")).toEqual({ selected: ["api"], anchor: "api" });
    expect(treeSelect({ ...multiple, selected: ["api"], anchor: "docs" }, "api")).toBeNull();
  });

  it.each([{ ctrl: true }, { meta: true }])("toggles one value with %o, anchoring there", (modifiers) => {
    // Arrange & Act & Assert
    expect(treeSelect({ ...multiple, selected: ["docs"] }, "api", modifiers)).toEqual({
      selected: ["docs", "api"],
      anchor: "api",
    });
    expect(treeSelect({ ...multiple, selected: ["docs", "api"] }, "docs", modifiers)).toEqual({
      selected: ["api"],
      anchor: "docs",
    });
  });

  it("selects the enabled visible range from the anchor with Shift, either way, keeping the anchor", () => {
    // Arrange
    const state = { ...multiple, selected: ["guides"], anchor: "guides", disabled: new Set(["intro"]) };

    // Act & Assert
    expect(treeSelect(state, "api", { shift: true })).toEqual({ selected: ["guides", "api"], anchor: "guides" });
    expect(treeSelect(state, "docs", { shift: true })).toEqual({ selected: ["docs", "guides"], anchor: "guides" });
  });

  it("ranges from the value itself with no anchor yet", () => {
    // Arrange & Act & Assert
    expect(treeSelect(multiple, "api", { shift: true })).toEqual({ selected: ["api"], anchor: null });
  });

  it("selects just the value when it is not in the visible order", () => {
    // Arrange & Act & Assert
    expect(treeSelect({ ...multiple, anchor: "docs" }, "hidden", { shift: true })).toEqual({
      selected: ["hidden"],
      anchor: "docs",
    });
  });

  it("selects just the value when the anchor is no longer visible", () => {
    // Arrange & Act & Assert
    expect(treeSelect({ ...multiple, anchor: "hidden" }, "api", { shift: true })).toEqual({
      selected: ["api"],
      anchor: "hidden",
    });
  });
});

describe("treeKeydown", () => {
  const byValue = new Map(NODES.map((node) => [node.value, node]));
  const state = (expanded: string[], disabled: string[] = []): TreeKeyState => ({
    order: treeVisibleOrder(NODES, expanded),
    expanded,
    disabled: new Set(disabled),
    nodeOf: (value) => byValue.get(value),
  });

  it("expands a collapsed branch with ArrowRight", () => {
    // Arrange & Act & Assert
    expect(treeKeydown(state([]), "docs", "ArrowRight")).toEqual({ toggle: "docs" });
  });

  it("moves to an expanded branch's first child with ArrowRight", () => {
    // Arrange & Act & Assert
    expect(treeKeydown(state(["docs"]), "docs", "ArrowRight")).toEqual({ focus: "guides" });
  });

  it("claims ArrowRight on an expanded branch with nothing after it, doing nothing", () => {
    // Arrange
    const lone: TreeKeyState = { order: ["solo"], expanded: ["solo"], disabled: new Set(), nodeOf: () => ({ value: "solo", parent: null, isBranch: true, disabled: false }) };

    // Act & Assert
    expect(treeKeydown(lone, "solo", "ArrowRight")).toStrictEqual({});
  });

  it.each([
    ["a leaf", [], [], "blog"],
    ["a disabled branch", [], ["docs"], "docs"],
  ])("leaves ArrowRight alone on %s", (_case, expanded, disabled, focused) => {
    // Arrange & Act & Assert
    expect(treeKeydown(state(expanded, disabled), focused, "ArrowRight")).toBeNull();
  });

  it("collapses an expanded branch with ArrowLeft", () => {
    // Arrange & Act & Assert
    expect(treeKeydown(state(["docs", "guides"]), "guides", "ArrowLeft")).toEqual({ toggle: "guides" });
  });

  it("moves to the parent with ArrowLeft from a child or a collapsed branch", () => {
    // Arrange & Act & Assert
    expect(treeKeydown(state(["docs", "guides"]), "intro", "ArrowLeft")).toEqual({ focus: "guides" });
    expect(treeKeydown(state(["docs"]), "guides", "ArrowLeft")).toEqual({ focus: "docs" });
  });

  it.each([
    ["a top-level item", [], [], "blog"],
    ["a disabled item", ["docs"], ["api"], "api"],
  ])("leaves ArrowLeft alone on %s", (_case, expanded, disabled, focused) => {
    // Arrange & Act & Assert
    expect(treeKeydown(state(expanded, disabled), focused, "ArrowLeft")).toBeNull();
  });

  it("moves through the enabled visible items with the vertical arrows, wrapping", () => {
    // Arrange
    const open = state(["docs", "guides"], ["intro"]);

    // Act & Assert
    expect(treeKeydown(open, "guides", "ArrowDown")).toEqual({ focus: "api" });
    expect(treeKeydown(open, "docs", "ArrowUp")).toEqual({ focus: "blog" });
    expect(treeKeydown(open, "api", "Home")).toEqual({ focus: "docs" });
    expect(treeKeydown(open, "docs", "End")).toEqual({ focus: "blog" });
  });

  it("lets Home and End escape a disabled item, where the arrows do nothing", () => {
    // Arrange
    const open = state(["docs"], ["api"]);

    // Act & Assert
    expect(treeKeydown(open, "api", "ArrowDown")).toBeNull();
    expect(treeKeydown(open, "api", "End")).toEqual({ focus: "blog" });
  });

  it.each(["Enter", " "])("activates with %j: a branch toggles and selects, a leaf selects", (key) => {
    // Arrange & Act & Assert
    expect(treeKeydown(state([]), "docs", key)).toEqual({ toggle: "docs", select: "docs" });
    expect(treeKeydown(state([]), "blog", key)).toEqual({ select: "blog" });
  });

  it("claims Enter on a disabled item but does nothing", () => {
    // Arrange & Act & Assert
    expect(treeKeydown(state([], ["blog"]), "blog", "Enter")).toEqual({});
  });

  it("treats a value it cannot find as a top-level leaf", () => {
    // Arrange & Act & Assert
    expect(treeKeydown(state([]), "ghost", "ArrowRight")).toBeNull();
    expect(treeKeydown(state([]), "ghost", "ArrowLeft")).toBeNull();
  });

  it("leaves other keys alone", () => {
    // Arrange & Act & Assert
    expect(treeKeydown(state([]), "docs", "a")).toBeNull();
  });
});
