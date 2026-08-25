import { render, screen } from "@testing-library/react";
import type { ComponentPropsWithRef } from "react";
import { describe, expect, it } from "vitest";

import { Tree, TREE_PART, useTreeLevel } from "../index";

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

  it("reads forceMount from the wrapper element, not from what it renders", () => {
    // A styled layer animates the open/close transition, which needs the group
    // to stay mounted while closed. Tree.Branch reads `forceMount` off the
    // element it is handed, so setting it *inside* the wrapper is invisible —
    // the subtree unmounts and there is nothing left to animate. This is the
    // contract the registry surface depends on.

    // Arrange / Act — closed, with forceMount on the wrapper element
    const { rerender } = render(
      <Tree.Root>
        <Tree.Branch value="src">
          <StyledBranchControl>src</StyledBranchControl>
          <StyledBranchContent forceMount>
            <Tree.Item value="index.ts">index.ts</Tree.Item>
          </StyledBranchContent>
        </Tree.Branch>
      </Tree.Root>,
    );

    // Assert — still in the DOM, marked closed and hidden from AT
    const group = document.querySelector('[role="group"]');
    expect(group).toHaveAttribute("data-state", "closed");
    expect(group).toHaveAttribute("aria-hidden", "true");

    // Act — without it, the branch drops the subtree entirely
    rerender(
      <Tree.Root>
        <Tree.Branch value="src">
          <StyledBranchControl>src</StyledBranchControl>
          <StyledBranchContent>
            <Tree.Item value="index.ts">index.ts</Tree.Item>
          </StyledBranchContent>
        </Tree.Branch>
      </Tree.Root>,
    );

    // Assert
    expect(document.querySelector('[role="group"]')).toBeNull();
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

describe("useTreeLevel", () => {
  function Depth() {
    const { depth } = useTreeLevel();
    return <span data-testid={`depth-${depth}`}>{depth}</span>;
  }

  it("reports the nesting depth so a styled layer can indent without attr()", () => {
    // A styled layer needs the depth as a NUMBER to compute a row's indent.
    // Reading it back off `data-depth` in CSS needs `attr(... type(<integer>))`,
    // which Firefox does not support — so the depth is exposed here instead.

    // Arrange / Act
    render(
      <Tree.Root defaultExpandedValues={["a", "b"]}>
        <Depth />
        <Tree.Branch value="a">
          <StyledBranchControl>a</StyledBranchControl>
          <StyledBranchContent>
            <Depth />
            <Tree.Branch value="b">
              <StyledBranchControl>b</StyledBranchControl>
              <StyledBranchContent>
                <Depth />
              </StyledBranchContent>
            </Tree.Branch>
          </StyledBranchContent>
        </Tree.Branch>
      </Tree.Root>,
    );

    // Assert — 0 at the root, one deeper per BranchContent
    expect(screen.getByTestId("depth-0")).toBeInTheDocument();
    expect(screen.getByTestId("depth-1")).toBeInTheDocument();
    expect(screen.getByTestId("depth-2")).toBeInTheDocument();
  });

  it("throws outside a Tree", () => {
    // Arrange / Act / Assert
    expect(() => render(<Depth />)).toThrow();
  });
});
