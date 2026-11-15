import { treePath, treeTabStop, treeToggle, treeVisibleOrder, type TreeNode } from "../policy";

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
