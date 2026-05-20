import { render, screen } from "@testing-library/react";

import { Tree } from "../Tree";

describe("Tree data-* attribute tests", () => {
  it("should expose data-selection-mode on the tree root", () => {
    // Arrange
    const { rerender } = render(
      <Tree.Root>
        <Tree.Item value="a">A</Tree.Item>
      </Tree.Root>,
    );

    // Assert
    expect(screen.getByRole("tree")).toHaveAttribute(
      "data-selection-mode",
      "single",
    );

    // Act
    rerender(
      <Tree.Root selectionMode="multiple">
        <Tree.Item value="a">A</Tree.Item>
      </Tree.Root>,
    );

    // Assert
    expect(screen.getByRole("tree")).toHaveAttribute(
      "data-selection-mode",
      "multiple",
    );
  });

  it("should tag leaves with data-leaf and branches with data-branch", () => {
    // Arrange
    render(
      <Tree.Root defaultExpandedValues={["src"]}>
        <Tree.Item value="readme">readme</Tree.Item>
        <Tree.Branch value="src">
          <Tree.BranchControl>src</Tree.BranchControl>
          <Tree.BranchContent>
            <Tree.Item value="index">index.ts</Tree.Item>
          </Tree.BranchContent>
        </Tree.Branch>
      </Tree.Root>,
    );

    // Assert
    expect(screen.getByText("readme")).toHaveAttribute("data-leaf", "");
    expect(screen.getByText("readme")).not.toHaveAttribute("data-branch");
    expect(
      screen.getByText("src").closest('[role="treeitem"]'),
    ).toHaveAttribute("data-branch", "");
  });

  it("should expose data-state open/closed on the branch treeitem", async () => {
    // Arrange
    render(
      <Tree.Root defaultExpandedValues={["src"]}>
        <Tree.Branch value="src">
          <Tree.BranchControl>src</Tree.BranchControl>
          <Tree.BranchContent>
            <Tree.Item value="index">index.ts</Tree.Item>
          </Tree.BranchContent>
        </Tree.Branch>
      </Tree.Root>,
    );

    // Assert
    expect(
      screen.getByText("src").closest('[role="treeitem"]'),
    ).toHaveAttribute("data-state", "open");
  });

  it("should apply data-selected to selected items", () => {
    // Arrange
    render(
      <Tree.Root defaultSelectedValue="a">
        <Tree.Item value="a">A</Tree.Item>
        <Tree.Item value="b">B</Tree.Item>
      </Tree.Root>,
    );

    // Assert
    expect(screen.getByText("A")).toHaveAttribute("data-selected", "");
    expect(screen.getByText("B")).not.toHaveAttribute("data-selected");
  });
});
