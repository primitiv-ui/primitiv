import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Tree } from "../Tree";

function renderControlled(props: {
  expandedValues: string[];
  onExpandedChange: (values: string[]) => void;
}) {
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

describe("Tree controlled expansion tests", () => {
  it("should reflect the consumer-supplied expandedValues", () => {
    // Arrange
    renderControlled({ expandedValues: ["src"], onExpandedChange: vi.fn() });

    // Assert
    expect(screen.getByText("index.ts")).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { expanded: true })).toBeInTheDocument();
  });

  it("should not change expansion itself when controlled", async () => {
    // Arrange
    const user = userEvent.setup();
    renderControlled({ expandedValues: [], onExpandedChange: vi.fn() });

    // Act
    await user.click(screen.getByText("src"));

    // Assert — the component defers; the branch stays collapsed
    expect(screen.queryByText("index.ts")).not.toBeInTheDocument();
  });

  it("should report the next expanded set through onExpandedChange when opening", async () => {
    // Arrange
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    renderControlled({ expandedValues: [], onExpandedChange });

    // Act
    await user.click(screen.getByText("src"));

    // Assert
    expect(onExpandedChange).toHaveBeenCalledWith(["src"]);
  });

  it("should report the next expanded set through onExpandedChange when closing", async () => {
    // Arrange
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    renderControlled({ expandedValues: ["src"], onExpandedChange });

    // Act
    await user.click(screen.getByText("src"));

    // Assert
    expect(onExpandedChange).toHaveBeenCalledWith([]);
  });

  it("should fire onExpandedChange in uncontrolled mode as well", async () => {
    // Arrange
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <Tree.Root onExpandedChange={onExpandedChange}>
        <Tree.Branch value="src">
          <Tree.BranchControl>src</Tree.BranchControl>
          <Tree.BranchContent>
            <Tree.Item value="index">index.ts</Tree.Item>
          </Tree.BranchContent>
        </Tree.Branch>
      </Tree.Root>,
    );

    // Act
    await user.click(screen.getByText("src"));

    // Assert — the callback fires and the branch still expands
    expect(onExpandedChange).toHaveBeenCalledWith(["src"]);
    expect(screen.getByText("index.ts")).toBeInTheDocument();
  });
});
