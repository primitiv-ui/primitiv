import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Tree } from "../Tree";

function renderNestedTree(props?: { defaultExpandedValues?: string[] }) {
  return render(
    <Tree.Root {...props}>
      <Tree.Item value="readme">readme</Tree.Item>
      <Tree.Branch value="src">
        <Tree.BranchControl>src</Tree.BranchControl>
        <Tree.BranchContent>
          <Tree.Item value="index">index.ts</Tree.Item>
        </Tree.BranchContent>
      </Tree.Branch>
    </Tree.Root>,
  );
}

const branchTreeitem = () =>
  screen.getByText("src").closest('[role="treeitem"]') as HTMLElement;

describe("Tree keyboard interaction tests", () => {
  it("should expand a collapsed branch on ArrowRight", async () => {
    // Arrange
    const user = userEvent.setup();
    renderNestedTree();

    // Act
    branchTreeitem().focus();
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(branchTreeitem()).toHaveAttribute("aria-expanded", "true");
  });

  it("should focus the first child on ArrowRight when the branch is already expanded", async () => {
    // Arrange
    const user = userEvent.setup();
    renderNestedTree({ defaultExpandedValues: ["src"] });

    // Act
    branchTreeitem().focus();
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(screen.getByText("index.ts")).toHaveFocus();
  });

  it("should collapse an expanded branch on ArrowLeft", async () => {
    // Arrange
    const user = userEvent.setup();
    renderNestedTree({ defaultExpandedValues: ["src"] });

    // Act
    branchTreeitem().focus();
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(branchTreeitem()).toHaveAttribute("aria-expanded", "false");
  });

  it("should focus the parent branch on ArrowLeft from a nested item", async () => {
    // Arrange
    const user = userEvent.setup();
    renderNestedTree({ defaultExpandedValues: ["src"] });

    // Act
    screen.getByText("index.ts").focus();
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(branchTreeitem()).toHaveFocus();
  });

  it("should leave a root-level leaf untouched on ArrowLeft", async () => {
    // Arrange
    const user = userEvent.setup();
    renderNestedTree();
    const readme = screen.getByText("readme");

    // Act
    readme.focus();
    await user.keyboard("{ArrowLeft}");

    // Assert — focus stays on readme
    expect(readme).toHaveFocus();
  });

  it("should select an item on Enter", async () => {
    // Arrange
    const user = userEvent.setup();
    renderNestedTree();

    // Act
    screen.getByText("readme").focus();
    await user.keyboard("{Enter}");

    // Assert
    expect(screen.getByText("readme")).toHaveAttribute("aria-selected", "true");
  });

  it("should select an item on Space", async () => {
    // Arrange
    const user = userEvent.setup();
    renderNestedTree();

    // Act
    screen.getByText("readme").focus();
    await user.keyboard("{ }");

    // Assert
    expect(screen.getByText("readme")).toHaveAttribute("aria-selected", "true");
  });

  it("should no-op on ArrowRight when an expanded branch has no following visible item", async () => {
    // Arrange — an expanded but empty branch at the very end of the tree
    const user = userEvent.setup();
    render(
      <Tree.Root defaultExpandedValues={["src"]}>
        <Tree.Branch value="src">
          <Tree.BranchControl>src</Tree.BranchControl>
          <Tree.BranchContent>{null}</Tree.BranchContent>
        </Tree.Branch>
      </Tree.Root>,
    );
    const branch = screen.getByText("src").closest('[role="treeitem"]')!;

    // Act
    (branch as HTMLElement).focus();
    await user.keyboard("{ArrowRight}");

    // Assert — focus stays on the branch
    expect(branch).toHaveFocus();
  });

  it("should toggle and select a branch on Enter", async () => {
    // Arrange
    const user = userEvent.setup();
    renderNestedTree();

    // Act
    branchTreeitem().focus();
    await user.keyboard("{Enter}");

    // Assert
    expect(branchTreeitem()).toHaveAttribute("aria-expanded", "true");
    expect(branchTreeitem()).toHaveAttribute("aria-selected", "true");
  });
});
