import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Tree } from "../Tree";

function renderTree(props?: { defaultExpandedValues?: string[] }) {
  return render(
    <Tree.Root {...props}>
      <Tree.Branch value="src">
        <Tree.BranchControl>src</Tree.BranchControl>
        <Tree.BranchContent>
          <Tree.Item value="index">index.ts</Tree.Item>
        </Tree.BranchContent>
      </Tree.Branch>
    </Tree.Root>,
  );
}

describe("Tree uncontrolled expansion tests", () => {
  it("should collapse branches by default", () => {
    // Arrange
    renderTree();

    // Assert
    expect(screen.queryByText("index.ts")).not.toBeInTheDocument();
    expect(screen.getByRole("treeitem")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("should expand a branch listed in defaultExpandedValues", () => {
    // Arrange
    renderTree({ defaultExpandedValues: ["src"] });

    // Assert
    expect(screen.getByText("index.ts")).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { expanded: true })).toBeInTheDocument();
  });

  it("should expand a collapsed branch when its control row is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    renderTree();

    // Act
    await user.click(screen.getByText("src"));

    // Assert
    expect(screen.getByText("index.ts")).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { expanded: true })).toBeInTheDocument();
  });

  it("should collapse an expanded branch when its control row is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    renderTree({ defaultExpandedValues: ["src"] });

    // Act
    await user.click(screen.getByText("src"));

    // Assert
    expect(screen.queryByText("index.ts")).not.toBeInTheDocument();
    expect(screen.getByRole("treeitem")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
