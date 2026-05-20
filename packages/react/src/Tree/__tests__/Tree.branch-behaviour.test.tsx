import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Tree } from "../Tree";

function renderTree(props?: {
  defaultExpandedValues?: string[];
  defaultSelectedValue?: string | null;
  onSelectedValueChange?: (value: string | null) => void;
}) {
  return render(
    <Tree.Root {...props}>
      <Tree.Branch value="src">
        <Tree.BranchControl>
          <Tree.BranchIndicator>chev</Tree.BranchIndicator>
          src
        </Tree.BranchControl>
        <Tree.BranchContent>
          <Tree.Item value="index">index.ts</Tree.Item>
        </Tree.BranchContent>
      </Tree.Branch>
    </Tree.Root>,
  );
}

const branchTreeitem = () =>
  screen.getByText("src").closest('[role="treeitem"]') as HTMLElement;

describe("Tree branch behaviour tests", () => {
  it("should not select a branch by default", () => {
    // Arrange
    renderTree();

    // Assert
    expect(branchTreeitem()).toHaveAttribute("aria-selected", "false");
  });

  it("should select the branch when its control row is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSelectedValueChange = vi.fn();
    renderTree({ onSelectedValueChange });

    // Act
    await user.click(screen.getByText("src"));

    // Assert
    expect(branchTreeitem()).toHaveAttribute("aria-selected", "true");
    expect(onSelectedValueChange).toHaveBeenCalledWith("src");
  });

  it("should expand and select on a single click of the control row", async () => {
    // Arrange
    const user = userEvent.setup();
    renderTree();

    // Act
    await user.click(screen.getByText("src"));

    // Assert
    expect(branchTreeitem()).toHaveAttribute("aria-expanded", "true");
    expect(branchTreeitem()).toHaveAttribute("aria-selected", "true");
  });

  it("should render the branch indicator as decorative with data-state", () => {
    // Arrange
    renderTree();

    // Assert
    const indicator = screen.getByText("chev");

    expect(indicator).toHaveAttribute("aria-hidden", "true");
    expect(indicator).toHaveAttribute("data-state", "closed");
  });

  it("should flip the indicator data-state when the branch expands", async () => {
    // Arrange
    const user = userEvent.setup();
    renderTree();

    // Act
    await user.click(screen.getByText("src"));

    // Assert
    expect(screen.getByText("chev")).toHaveAttribute("data-state", "open");
  });
});
