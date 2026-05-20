import { render, screen } from "@testing-library/react";

import { Tree, useTreePath } from "../../Tree";
import type { TreePathSegment } from "../../Tree";

function PathProbe({ value }: { value: string }) {
  const path = useTreePath(value);
  return <pre data-testid={`path-${value}`}>{JSON.stringify(path)}</pre>;
}

function readPath(value: string): TreePathSegment[] {
  return JSON.parse(screen.getByTestId(`path-${value}`).textContent ?? "[]");
}

describe("Tree selection-path tests", () => {
  describe("useTreePath", () => {
    it("should return the root-to-leaf path of an item with labels carried from props", () => {
      // Arrange
      render(
        <Tree.Root defaultExpandedValues={["src", "components"]}>
          <Tree.Branch value="src" label="src">
            <Tree.BranchControl>src</Tree.BranchControl>
            <Tree.BranchContent>
              <Tree.Branch value="components" label="components">
                <Tree.BranchControl>components</Tree.BranchControl>
                <Tree.BranchContent>
                  <Tree.Item value="button" label="button.tsx">
                    button.tsx
                  </Tree.Item>
                </Tree.BranchContent>
              </Tree.Branch>
            </Tree.BranchContent>
          </Tree.Branch>
          <PathProbe value="button" />
        </Tree.Root>,
      );

      // Assert
      const path = readPath("button");

      expect(path.map((segment) => segment.value)).toEqual([
        "src",
        "components",
        "button",
      ]);
      expect(path.map((segment) => segment.label)).toEqual([
        "src",
        "components",
        "button.tsx",
      ]);
      expect(path.map((segment) => segment.isBranch)).toEqual([
        true,
        true,
        false,
      ]);
    });
  });
});
