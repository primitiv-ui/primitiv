import { treeVisibleOrder, type TreeNode } from "../policy";

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
