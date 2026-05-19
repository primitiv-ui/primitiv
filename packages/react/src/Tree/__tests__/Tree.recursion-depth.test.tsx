import { render, screen } from "@testing-library/react";

import { Tree } from "../Tree";

function renderNestedTree() {
  return render(
    <Tree.Root>
      <Tree.Item value="root-leaf">root-leaf</Tree.Item>
      <Tree.Branch value="src">
        <Tree.BranchControl>src</Tree.BranchControl>
        <Tree.BranchContent>
          <Tree.Item value="index">index.ts</Tree.Item>
          <Tree.Branch value="components">
            <Tree.BranchControl>components</Tree.BranchControl>
            <Tree.BranchContent>
              <Tree.Item value="button">button.tsx</Tree.Item>
            </Tree.BranchContent>
          </Tree.Branch>
        </Tree.BranchContent>
      </Tree.Branch>
    </Tree.Root>,
  );
}

const treeitemOf = (text: string) =>
  screen.getByText(text).closest('[role="treeitem"]') as HTMLElement;

describe("Tree recursion depth tests", () => {
  it("should render a root-level item at depth 0 with aria-level 1", () => {
    // Arrange
    renderNestedTree();

    // Assert
    expect(treeitemOf("root-leaf")).toHaveAttribute("data-depth", "0");
    expect(treeitemOf("root-leaf")).toHaveAttribute("aria-level", "1");
  });

  it("should render a root-level branch at depth 0 with aria-level 1", () => {
    // Arrange
    renderNestedTree();

    // Assert
    expect(treeitemOf("src")).toHaveAttribute("data-depth", "0");
    expect(treeitemOf("src")).toHaveAttribute("aria-level", "1");
  });

  it("should render a nested item one level deeper than its branch", () => {
    // Arrange
    renderNestedTree();

    // Assert
    expect(treeitemOf("index.ts")).toHaveAttribute("data-depth", "1");
    expect(treeitemOf("index.ts")).toHaveAttribute("aria-level", "2");
  });

  it("should render a nested branch one level deeper than its parent branch", () => {
    // Arrange
    renderNestedTree();

    // Assert
    expect(treeitemOf("components")).toHaveAttribute("data-depth", "1");
    expect(treeitemOf("components")).toHaveAttribute("aria-level", "2");
  });

  it("should render a deeply nested item at depth 2 with aria-level 3", () => {
    // Arrange
    renderNestedTree();

    // Assert
    expect(treeitemOf("button.tsx")).toHaveAttribute("data-depth", "2");
    expect(treeitemOf("button.tsx")).toHaveAttribute("aria-level", "3");
  });
});
