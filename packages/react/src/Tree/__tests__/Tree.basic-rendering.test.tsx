import { render, screen } from "@testing-library/react";

import { Tree } from "../Tree";

describe("Tree basic rendering tests", () => {
  it("should render the root as an element with role='tree'", () => {
    // Arrange
    render(
      <Tree.Root>
        <Tree.Item value="a">Item A</Tree.Item>
      </Tree.Root>,
    );

    // Assert
    expect(screen.getByRole("tree")).toBeInTheDocument();
  });

  it("should render each item as a treeitem with its content", () => {
    // Arrange
    render(
      <Tree.Root>
        <Tree.Item value="a">Apples</Tree.Item>
        <Tree.Item value="b">Bananas</Tree.Item>
      </Tree.Root>,
    );

    // Assert
    const items = screen.getAllByRole("treeitem");

    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Apples");
    expect(items[1]).toHaveTextContent("Bananas");
  });

  it("should forward unknown props to the rendered root element", () => {
    // Arrange
    render(
      <Tree.Root data-testid="tree" aria-label="Files">
        <Tree.Item value="a">Item A</Tree.Item>
      </Tree.Root>,
    );

    // Assert
    expect(screen.getByTestId("tree")).toHaveAttribute("aria-label", "Files");
  });

  it("should ignore non-Tree elements interleaved with a branch's slots", () => {
    // Arrange
    render(
      <Tree.Root defaultExpandedValues={["src"]}>
        <Tree.Branch value="src">
          <Tree.BranchControl>src</Tree.BranchControl>
          <span data-testid="stray">ignored</span>
          <Tree.BranchContent>
            <Tree.Item value="index">index.ts</Tree.Item>
          </Tree.BranchContent>
        </Tree.Branch>
      </Tree.Root>,
    );

    // Assert — stray element doesn't disrupt the partition; nested item still renders
    expect(screen.getByRole("group")).toContainElement(
      screen.getByRole("treeitem", { name: "index.ts" }),
    );
    expect(screen.queryByTestId("stray")).not.toBeInTheDocument();
  });

  it("should partition a branch's children through React fragments", () => {
    // Arrange
    render(
      <Tree.Root defaultExpandedValues={["src"]}>
        <Tree.Branch value="src">
          <>
            <Tree.BranchControl>src</Tree.BranchControl>
            <Tree.BranchContent>
              <Tree.Item value="index">index.ts</Tree.Item>
            </Tree.BranchContent>
          </>
        </Tree.Branch>
      </Tree.Root>,
    );

    // Assert
    expect(screen.getByRole("group")).toContainElement(
      screen.getByRole("treeitem", { name: "index.ts" }),
    );
  });

  it("should render a branch as a treeitem with its control row and a content group", () => {
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
    const branch = screen.getByRole("treeitem", { name: /src/ });
    const group = screen.getByRole("group");

    expect(branch).toContainElement(group);
    expect(group).toContainElement(
      screen.getByRole("treeitem", { name: "index.ts" }),
    );
  });
});
