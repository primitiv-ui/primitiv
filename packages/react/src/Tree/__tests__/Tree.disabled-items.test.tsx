import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Tree } from "../Tree";

describe("Tree disabled items tests", () => {
  it("should expose aria-disabled and data-disabled on a disabled item", () => {
    // Arrange
    render(
      <Tree.Root>
        <Tree.Item value="a" disabled>
          Apples
        </Tree.Item>
      </Tree.Root>,
    );

    // Assert
    const item = screen.getByText("Apples");

    expect(item).toHaveAttribute("aria-disabled", "true");
    expect(item).toHaveAttribute("data-disabled", "");
  });

  it("should not select a disabled item when clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSelectedValueChange = vi.fn();
    render(
      <Tree.Root onSelectedValueChange={onSelectedValueChange}>
        <Tree.Item value="a" disabled>
          Apples
        </Tree.Item>
      </Tree.Root>,
    );

    // Act
    await user.click(screen.getByText("Apples"));

    // Assert
    expect(onSelectedValueChange).not.toHaveBeenCalled();
    expect(screen.getByText("Apples")).toHaveAttribute("aria-selected", "false");
  });

  it("should skip disabled items when defaulting the roving tabstop", () => {
    // Arrange
    render(
      <Tree.Root>
        <Tree.Item value="a" disabled>
          Apples
        </Tree.Item>
        <Tree.Item value="b">Bananas</Tree.Item>
      </Tree.Root>,
    );

    // Assert
    expect(screen.getByText("Apples")).toHaveAttribute("tabindex", "-1");
    expect(screen.getByText("Bananas")).toHaveAttribute("tabindex", "0");
  });

  it("should skip disabled items in arrow navigation", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Tree.Root>
        <Tree.Item value="a">Apples</Tree.Item>
        <Tree.Item value="b" disabled>
          Bananas
        </Tree.Item>
        <Tree.Item value="c">Cherries</Tree.Item>
      </Tree.Root>,
    );

    // Act
    screen.getByText("Apples").focus();
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(screen.getByText("Cherries")).toHaveFocus();
  });

  it("should not toggle or select a disabled branch on click", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Tree.Root>
        <Tree.Branch value="src" disabled>
          <Tree.BranchControl>src</Tree.BranchControl>
          <Tree.BranchContent>
            <Tree.Item value="index">index.ts</Tree.Item>
          </Tree.BranchContent>
        </Tree.Branch>
      </Tree.Root>,
    );

    // Act
    await user.click(screen.getByText("src"));

    // Assert — branch stays collapsed and unselected
    const branch = screen.getByText("src").closest('[role="treeitem"]');

    expect(branch).toHaveAttribute("aria-expanded", "false");
    expect(branch).toHaveAttribute("aria-selected", "false");
  });

  it("should not select a disabled item on Enter", async () => {
    // Arrange — sibling enabled item so navigable isn't empty
    const user = userEvent.setup();
    render(
      <Tree.Root>
        <Tree.Item value="a" disabled>
          Apples
        </Tree.Item>
        <Tree.Item value="b">Bananas</Tree.Item>
      </Tree.Root>,
    );

    // Act
    screen.getByText("Apples").focus();
    await user.keyboard("{Enter}");

    // Assert
    expect(screen.getByText("Apples")).toHaveAttribute("aria-selected", "false");
  });

  it("should treat ArrowRight on a leaf as a no-op", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Tree.Root>
        <Tree.Item value="a">Apples</Tree.Item>
        <Tree.Item value="b">Bananas</Tree.Item>
      </Tree.Root>,
    );

    // Act
    screen.getByText("Apples").focus();
    await user.keyboard("{ArrowRight}");

    // Assert — focus stayed on Apples
    expect(screen.getByText("Apples")).toHaveFocus();
  });

  it("should treat ArrowLeft on a disabled branch as a no-op", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Tree.Root defaultExpandedValues={["src"]}>
        <Tree.Branch value="src" disabled>
          <Tree.BranchControl>src</Tree.BranchControl>
          <Tree.BranchContent>
            <Tree.Item value="index">index.ts</Tree.Item>
          </Tree.BranchContent>
        </Tree.Branch>
      </Tree.Root>,
    );
    const branch = screen.getByText("src").closest('[role="treeitem"]')!;

    // Act
    (branch as HTMLElement).focus();
    await user.keyboard("{ArrowLeft}");

    // Assert — branch stays expanded
    expect(branch).toHaveAttribute("aria-expanded", "true");
  });

  it("should exclude disabled items from a Shift+click range selection", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Tree.Root selectionMode="multiple">
        <Tree.Item value="a">Apples</Tree.Item>
        <Tree.Item value="b" disabled>
          Bananas
        </Tree.Item>
        <Tree.Item value="c">Cherries</Tree.Item>
      </Tree.Root>,
    );

    // Act
    await user.click(screen.getByText("Apples"));
    await user.keyboard("{Shift>}");
    await user.click(screen.getByText("Cherries"));
    await user.keyboard("{/Shift}");

    // Assert
    expect(screen.getByText("Apples")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Bananas")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.getByText("Cherries")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
