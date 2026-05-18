import { render, screen } from "@testing-library/react";

import { Avatar } from "../Avatar";

describe("Avatar basic rendering", () => {
  it("renders Avatar.Root as a <span>", () => {
    // Arrange & Act
    render(<Avatar.Root data-testid="avatar" />);
    const root = screen.getByTestId("avatar");

    // Assert
    expect(root.tagName).toBe("SPAN");
  });
});
