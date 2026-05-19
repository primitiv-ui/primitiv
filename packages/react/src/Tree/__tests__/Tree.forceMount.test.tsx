import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Tree } from "../Tree";

function renderTree(props?: { defaultExpandedValues?: string[] }) {
  return render(
    <Tree.Root {...props}>
      <Tree.Branch value="src">
        <Tree.BranchControl>src</Tree.BranchControl>
        <Tree.BranchContent forceMount>
          <Tree.Item value="index">index.ts</Tree.Item>
        </Tree.BranchContent>
      </Tree.Branch>
    </Tree.Root>,
  );
}

describe("Tree forceMount tests", () => {
  it("should keep BranchContent mounted while the branch is collapsed", () => {
    // Arrange
    renderTree();

    // Assert
    expect(screen.getByRole("group", { hidden: true })).toBeInTheDocument();
    expect(screen.getByText("index.ts")).toBeInTheDocument();
  });

  it("should mark collapsed forceMount content as closed and aria-hidden", () => {
    // Arrange
    renderTree();

    // Assert
    const group = screen.getByRole("group", { hidden: true });

    expect(group).toHaveAttribute("data-state", "closed");
    expect(group).toHaveAttribute("aria-hidden", "true");
  });

  it("should not apply the hidden attribute to forceMount content", () => {
    // Arrange
    renderTree();

    // Assert
    expect(screen.getByRole("group", { hidden: true })).not.toHaveAttribute(
      "hidden",
    );
  });

  it("should mark expanded forceMount content as open without aria-hidden", () => {
    // Arrange
    renderTree({ defaultExpandedValues: ["src"] });

    // Assert
    const group = screen.getByRole("group");

    expect(group).toHaveAttribute("data-state", "open");
    expect(group).not.toHaveAttribute("aria-hidden");
  });

  it("should update the forceMount content state when the branch is toggled", async () => {
    // Arrange
    const user = userEvent.setup();
    renderTree();

    // Act
    await user.click(screen.getByText("src"));

    // Assert
    expect(screen.getByRole("group")).toHaveAttribute("data-state", "open");
  });
});
