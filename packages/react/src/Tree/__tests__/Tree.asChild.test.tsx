import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Tree } from "../Tree";

describe("Tree asChild tests", () => {
  it("should render Tree.Item as the supplied child element", () => {
    // Arrange
    render(
      <Tree.Root>
        <Tree.Item value="a" asChild>
          <a href="/apples">Apples</a>
        </Tree.Item>
      </Tree.Root>,
    );

    // Assert
    const link = screen.getByRole("treeitem");

    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/apples");
    expect(link).toHaveTextContent("Apples");
  });

  it("should still wire selection through an asChild Tree.Item", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Tree.Root>
        <Tree.Item value="a" asChild>
          <a href="/apples">Apples</a>
        </Tree.Item>
      </Tree.Root>,
    );

    // Act
    await user.click(screen.getByRole("treeitem"));

    // Assert
    expect(screen.getByRole("treeitem")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("should render Tree.BranchControl as the supplied child element", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Tree.Root>
        <Tree.Branch value="src">
          <Tree.BranchControl asChild>
            <button type="button">src</button>
          </Tree.BranchControl>
          <Tree.BranchContent>
            <Tree.Item value="index">index.ts</Tree.Item>
          </Tree.BranchContent>
        </Tree.Branch>
      </Tree.Root>,
    );

    const button = screen.getByRole("button", { name: "src" });

    // Act
    await user.click(button);

    // Assert
    expect(button.tagName).toBe("BUTTON");
    expect(button.closest('[role="treeitem"]')).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("should render Tree.BranchIndicator as the supplied child element", () => {
    // Arrange
    render(
      <Tree.Root>
        <Tree.Branch value="src">
          <Tree.BranchControl>
            <Tree.BranchIndicator asChild>
              <svg data-testid="chevron-icon" aria-hidden="true" />
            </Tree.BranchIndicator>
            src
          </Tree.BranchControl>
          <Tree.BranchContent>
            <Tree.Item value="index">index.ts</Tree.Item>
          </Tree.BranchContent>
        </Tree.Branch>
      </Tree.Root>,
    );

    // Assert
    const icon = screen.getByTestId("chevron-icon");
    expect(icon.tagName).toBe("svg");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("data-state", "closed");
  });

  it("should merge data-state onto the asChild Tree.BranchIndicator when the branch is expanded", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Tree.Root defaultExpandedValues={["src"]}>
        <Tree.Branch value="src">
          <Tree.BranchControl>
            <Tree.BranchIndicator asChild>
              <svg data-testid="chevron-icon" aria-hidden="true" />
            </Tree.BranchIndicator>
            src
          </Tree.BranchControl>
          <Tree.BranchContent>
            <Tree.Item value="index">index.ts</Tree.Item>
          </Tree.BranchContent>
        </Tree.Branch>
      </Tree.Root>,
    );

    // Assert — starts open
    expect(screen.getByTestId("chevron-icon")).toHaveAttribute(
      "data-state",
      "open",
    );

    // Act — collapse
    await user.click(screen.getByTestId("chevron-icon"));

    // Assert — now closed
    expect(screen.getByTestId("chevron-icon")).toHaveAttribute(
      "data-state",
      "closed",
    );
  });
});
