import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Tree } from "../Tree";

function renderFlatTree() {
  return render(
    <Tree.Root selectionMode="multiple">
      <Tree.Item value="a">Apples</Tree.Item>
      <Tree.Item value="b">Bananas</Tree.Item>
      <Tree.Item value="c">Cherries</Tree.Item>
      <Tree.Item value="d">Dates</Tree.Item>
    </Tree.Root>,
  );
}

function renderNestedTree() {
  return render(
    <Tree.Root
      selectionMode="multiple"
      defaultExpandedValues={["src"]}
    >
      <Tree.Item value="readme">readme</Tree.Item>
      <Tree.Branch value="src">
        <Tree.BranchControl>src</Tree.BranchControl>
        <Tree.BranchContent>
          <Tree.Item value="index">index.ts</Tree.Item>
          <Tree.Item value="button">button.ts</Tree.Item>
        </Tree.BranchContent>
      </Tree.Branch>
      <Tree.Item value="pkg">package.json</Tree.Item>
    </Tree.Root>,
  );
}

describe("Tree range selection tests", () => {
  it("should select a contiguous range with Shift+click using the previous click as anchor", async () => {
    // Arrange
    const user = userEvent.setup();
    renderFlatTree();

    // Act
    await user.click(screen.getByText("Apples"));
    await user.keyboard("{Shift>}");
    await user.click(screen.getByText("Cherries"));
    await user.keyboard("{/Shift}");

    // Assert
    expect(screen.getByText("Apples")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Bananas")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Cherries")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Dates")).toHaveAttribute("aria-selected", "false");
  });

  it("should treat the clicked item as anchor when no previous click set one", async () => {
    // Arrange
    const user = userEvent.setup();
    renderFlatTree();

    // Act
    await user.keyboard("{Shift>}");
    await user.click(screen.getByText("Bananas"));
    await user.keyboard("{/Shift}");

    // Assert — only Bananas selected
    expect(screen.getByText("Bananas")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Apples")).toHaveAttribute("aria-selected", "false");
  });

  it("should support a backward Shift+click range", async () => {
    // Arrange
    const user = userEvent.setup();
    renderFlatTree();

    // Act
    await user.click(screen.getByText("Cherries"));
    await user.keyboard("{Shift>}");
    await user.click(screen.getByText("Apples"));
    await user.keyboard("{/Shift}");

    // Assert
    expect(screen.getByText("Apples")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Bananas")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Cherries")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("should include visible nested items in a Shift+click range", async () => {
    // Arrange
    const user = userEvent.setup();
    renderNestedTree();

    // Act
    await user.click(screen.getByText("readme"));
    await user.keyboard("{Shift>}");
    await user.click(screen.getByText("button.ts"));
    await user.keyboard("{/Shift}");

    // Assert — readme, src (branch), index.ts, button.ts
    expect(screen.getByText("readme")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("index.ts")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("button.ts")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("package.json")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("should skip collapsed branch children when ranging across a closed branch", async () => {
    // Arrange — src is collapsed
    const user = userEvent.setup();
    render(
      <Tree.Root selectionMode="multiple">
        <Tree.Item value="readme">readme</Tree.Item>
        <Tree.Branch value="src">
          <Tree.BranchControl>src</Tree.BranchControl>
          <Tree.BranchContent>
            <Tree.Item value="index">index.ts</Tree.Item>
          </Tree.BranchContent>
        </Tree.Branch>
        <Tree.Item value="pkg">package.json</Tree.Item>
      </Tree.Root>,
    );

    // Act — click readme, then Shift+click package.json
    await user.click(screen.getByText("readme"));
    await user.keyboard("{Shift>}");
    await user.click(screen.getByText("package.json"));
    await user.keyboard("{/Shift}");

    // Assert — readme, src, pkg selected; nested index.ts is not visible
    expect(screen.getByText("readme")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("package.json")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.queryByText("index.ts")).not.toBeInTheDocument();
  });
});
