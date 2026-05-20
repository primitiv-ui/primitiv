import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Tree } from "../Tree";

function renderTree() {
  return render(
    <Tree.Root>
      <Tree.Item value="a">Apples</Tree.Item>
      <Tree.Item value="b">Bananas</Tree.Item>
      <Tree.Item value="c">Cherries</Tree.Item>
    </Tree.Root>,
  );
}

describe("Tree roving tabindex tests", () => {
  it("should give only the first visible item a tabIndex of 0", () => {
    // Arrange
    renderTree();

    // Assert
    expect(screen.getByText("Apples")).toHaveAttribute("tabindex", "0");
    expect(screen.getByText("Bananas")).toHaveAttribute("tabindex", "-1");
    expect(screen.getByText("Cherries")).toHaveAttribute("tabindex", "-1");
  });

  it("should move focus to the next visible item on ArrowDown", async () => {
    // Arrange
    const user = userEvent.setup();
    renderTree();

    // Act
    screen.getByText("Apples").focus();
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(screen.getByText("Bananas")).toHaveFocus();
    expect(screen.getByText("Bananas")).toHaveAttribute("tabindex", "0");
    expect(screen.getByText("Apples")).toHaveAttribute("tabindex", "-1");
  });

  it("should move focus to the previous visible item on ArrowUp", async () => {
    // Arrange
    const user = userEvent.setup();
    renderTree();

    // Act
    screen.getByText("Bananas").focus();
    await user.keyboard("{ArrowUp}");

    // Assert
    expect(screen.getByText("Apples")).toHaveFocus();
  });

  it("should move focus to the first visible item on Home", async () => {
    // Arrange
    const user = userEvent.setup();
    renderTree();

    // Act
    screen.getByText("Cherries").focus();
    await user.keyboard("{Home}");

    // Assert
    expect(screen.getByText("Apples")).toHaveFocus();
  });

  it("should move focus to the last visible item on End", async () => {
    // Arrange
    const user = userEvent.setup();
    renderTree();

    // Act
    screen.getByText("Apples").focus();
    await user.keyboard("{End}");

    // Assert
    expect(screen.getByText("Cherries")).toHaveFocus();
  });

  it("should move the tabstop when an item is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    renderTree();

    // Act
    await user.click(screen.getByText("Bananas"));

    // Assert
    expect(screen.getByText("Bananas")).toHaveAttribute("tabindex", "0");
    expect(screen.getByText("Apples")).toHaveAttribute("tabindex", "-1");
  });

  it("should skip nested items inside collapsed branches when navigating", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Tree.Root>
        <Tree.Item value="a">Apples</Tree.Item>
        <Tree.Branch value="src">
          <Tree.BranchControl>src</Tree.BranchControl>
          <Tree.BranchContent>
            <Tree.Item value="index">index.ts</Tree.Item>
          </Tree.BranchContent>
        </Tree.Branch>
        <Tree.Item value="b">Bananas</Tree.Item>
      </Tree.Root>,
    );

    // Act
    screen.getByText("Apples").focus();
    await user.keyboard("{ArrowDown}{ArrowDown}");

    // Assert — moved through src branch into Bananas (index.ts hidden)
    expect(screen.getByText("Bananas")).toHaveFocus();
  });
});
