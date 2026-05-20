import { render } from "@testing-library/react";

import { Tree } from "../Tree";

describe("Tree error handling tests", () => {
  it("should throw when Tree.Item is rendered outside Tree.Root", () => {
    // Act / Assert
    expect(() => render(<Tree.Item value="a">Orphan</Tree.Item>)).toThrow(
      "<Tree.Root>",
    );
  });

  it("should throw when a branch declares more than one BranchControl", () => {
    // Act / Assert
    expect(() =>
      render(
        <Tree.Root>
          <Tree.Branch value="src">
            <Tree.BranchControl>src</Tree.BranchControl>
            <Tree.BranchControl>src again</Tree.BranchControl>
          </Tree.Branch>
        </Tree.Root>,
      ),
    ).toThrow("at most one <Tree.BranchControl>");
  });

  it("should throw when a branch declares more than one BranchContent", () => {
    // Act / Assert
    expect(() =>
      render(
        <Tree.Root>
          <Tree.Branch value="src">
            <Tree.BranchControl>src</Tree.BranchControl>
            <Tree.BranchContent>
              <Tree.Item value="a">A</Tree.Item>
            </Tree.BranchContent>
            <Tree.BranchContent>
              <Tree.Item value="b">B</Tree.Item>
            </Tree.BranchContent>
          </Tree.Branch>
        </Tree.Root>,
      ),
    ).toThrow("at most one <Tree.BranchContent>");
  });

  it("should throw when Tree.BranchControl is rendered outside Tree.Branch", () => {
    // Act / Assert
    expect(() =>
      render(
        <Tree.Root>
          <Tree.BranchControl>Orphan</Tree.BranchControl>
        </Tree.Root>,
      ),
    ).toThrow("<Tree.Branch>");
  });

  it("should throw when a branch is missing a BranchControl", () => {
    // Act / Assert
    expect(() =>
      render(
        <Tree.Root>
          <Tree.Branch value="src">
            <Tree.BranchContent>
              <Tree.Item value="a">A</Tree.Item>
            </Tree.BranchContent>
          </Tree.Branch>
        </Tree.Root>,
      ),
    ).toThrow("must contain a <Tree.BranchControl>");
  });
});
