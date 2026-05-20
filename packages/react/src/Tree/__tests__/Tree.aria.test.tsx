import { render, screen } from "@testing-library/react";

import { Tree } from "../Tree";

describe("Tree ARIA wiring tests", () => {
  it("should label a branch with its BranchControl via aria-labelledby", () => {
    // Arrange
    render(
      <Tree.Root>
        <Tree.Branch value="src">
          <Tree.BranchControl>src</Tree.BranchControl>
          <Tree.BranchContent>
            <Tree.Item value="index">index.ts</Tree.Item>
          </Tree.BranchContent>
        </Tree.Branch>
      </Tree.Root>,
    );

    const branch = screen.getByText("src").closest('[role="treeitem"]')!;
    const labelId = branch.getAttribute("aria-labelledby");

    // Assert
    expect(labelId).not.toBeNull();
    expect(screen.getByText("src")).toHaveAttribute("id", labelId);
  });

  it("should expose aria-multiselectable only in multiple selection mode", () => {
    // Arrange / Act
    const { rerender } = render(
      <Tree.Root>
        <Tree.Item value="a">A</Tree.Item>
      </Tree.Root>,
    );

    // Assert
    expect(screen.getByRole("tree")).not.toHaveAttribute(
      "aria-multiselectable",
    );

    // Act
    rerender(
      <Tree.Root selectionMode="multiple">
        <Tree.Item value="a">A</Tree.Item>
      </Tree.Root>,
    );

    // Assert
    expect(screen.getByRole("tree")).toHaveAttribute(
      "aria-multiselectable",
      "true",
    );
  });
});
