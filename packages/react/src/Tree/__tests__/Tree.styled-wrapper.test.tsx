import { render, screen } from "@testing-library/react";
import type { ComponentPropsWithRef } from "react";
import { describe, expect, it } from "vitest";

import { Tree, TREE_PART } from "../index";

/**
 * A styled layer wraps every part in its own component to attach classes — the
 * shape `primitiv add tree` copies into a consumer repo. `Tree.Branch` finds its
 * control and content by inspecting its children, so those wrappers have to be
 * recognisable as the parts they render; without that, Tree is the one primitive
 * in the library that cannot be wrapped at all.
 */
function StyledBranchControl(props: ComponentPropsWithRef<typeof Tree.BranchControl>) {
  return <Tree.BranchControl {...props} className="styled-control" />;
}
StyledBranchControl[TREE_PART] = "branch-control";

function StyledBranchContent(props: ComponentPropsWithRef<typeof Tree.BranchContent>) {
  return <Tree.BranchContent {...props} className="styled-content" />;
}
StyledBranchContent[TREE_PART] = "branch-content";

describe("Tree — styled wrappers", () => {
  it("accepts a wrapper component in place of Tree.BranchControl", () => {
    // Arrange / Act
    render(
      <Tree.Root defaultExpandedValues={["src"]}>
        <Tree.Branch value="src">
          <StyledBranchControl>src</StyledBranchControl>
          <StyledBranchContent>
            <Tree.Item value="index.ts">index.ts</Tree.Item>
          </StyledBranchContent>
        </Tree.Branch>
      </Tree.Root>,
    );

    // Assert
    expect(screen.getByText("src")).toHaveClass("styled-control");
    expect(screen.getByRole("group")).toHaveClass("styled-content");
  });

  it("labels the branch by its wrapped control, so the name is just the row", () => {
    // Arrange / Act
    render(
      <Tree.Root defaultExpandedValues={["src"]}>
        <Tree.Branch value="src">
          <StyledBranchControl>src</StyledBranchControl>
          <StyledBranchContent>
            <Tree.Item value="index.ts">index.ts</Tree.Item>
          </StyledBranchContent>
        </Tree.Branch>
      </Tree.Root>,
    );

    // Assert — the branch treeitem takes its accessible name from the control
    // row alone, not from the whole subtree.
    expect(screen.getByRole("treeitem", { name: "src" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("still rejects two controls when both are wrappers", () => {
    // Arrange / Act / Assert
    expect(() =>
      render(
        <Tree.Root>
          <Tree.Branch value="src">
            <StyledBranchControl>one</StyledBranchControl>
            <StyledBranchControl>two</StyledBranchControl>
          </Tree.Branch>
        </Tree.Root>,
      ),
    ).toThrow("A Tree.Branch may contain at most one <Tree.BranchControl>.");
  });
});
