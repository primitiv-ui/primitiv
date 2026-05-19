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
});
