import { render, screen } from "@testing-library/react";

import {
  Tree,
  TreeBranch,
  TreeBranchContent,
  TreeBranchControl,
  TreeBranchIndicator,
  TreeItem,
  TreeRoot,
  TreeSelectionPath,
  TREE_PART,
} from "..";
import { TreeContext, TreeItemContext, TreeLevelContext } from "../TreeContext";

describe("Tree contract", () => {
  it("names every part for devtools", () => {
    // Arrange & Act & Assert
    expect(Tree.displayName).toBe("Tree");
    expect(TreeRoot.displayName).toBe("Tree");
    expect(TreeItem.displayName).toBe("TreeItem");
    expect(TreeBranch.displayName).toBe("TreeBranch");
    expect(TreeBranchControl.displayName).toBe("TreeBranchControl");
    expect(TreeBranchContent.displayName).toBe("TreeBranchContent");
    expect(TreeBranchIndicator.displayName).toBe("TreeBranchIndicator");
    expect(TreeSelectionPath.displayName).toBe("TreeSelectionPath");
  });

  it("names its contexts for devtools", () => {
    // Arrange & Act & Assert
    expect(TreeContext.displayName).toBe("TreeContext");
    expect(TreeLevelContext.displayName).toBe("TreeLevelContext");
    expect(TreeItemContext.displayName).toBe("TreeItemContext");
  });

  it("publishes the part marker a styled wrapper sets", () => {
    // Arrange & Act & Assert
    expect(TREE_PART).toBe("__primitivTreePart");
  });

  it("says where a part must be rendered", () => {
    // Arrange
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Act & Assert
    expect(() => render(<Tree.Item value="a">Orphan</Tree.Item>)).toThrow(
      "Tree sub-components must be rendered inside <Tree.Root>.",
    );
    expect(() => render(<Tree.SelectionPath />)).toThrow(
      "Tree sub-components must be rendered inside <Tree.Root>.",
    );
    expect(() =>
      render(
        <Tree.Root>
          <Tree.BranchControl>Row</Tree.BranchControl>
        </Tree.Root>,
      ),
    ).toThrow(
      "Tree.BranchControl must be rendered inside a <Tree.Branch>.",
    );
    vi.restoreAllMocks();
  });

  it("finds a row wrapped in a fragment, but not one wrapped in an element", () => {
    // Arrange
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    render(
      <Tree.Root>
        <Tree.Branch value="a">
          text beside the row
          <>
            <Tree.BranchControl>A</Tree.BranchControl>
          </>
        </Tree.Branch>
      </Tree.Root>,
    );
    const wrapped = () =>
      render(
        <Tree.Root>
          <Tree.Branch value="b">
            <div>
              <Tree.BranchControl>B</Tree.BranchControl>
            </div>
          </Tree.Branch>
        </Tree.Root>,
      );

    // Assert
    expect(screen.getByRole("treeitem", { name: "A" })).toBeTruthy();
    expect(wrapped).toThrow("must contain a <Tree.BranchControl>");
    vi.restoreAllMocks();
  });
});
