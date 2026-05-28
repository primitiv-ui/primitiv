import { render, screen } from "@testing-library/react";

import { InputGroup } from "../InputGroup";

describe("InputGroup basic rendering", () => {
  it("renders a wrapper element", () => {
    // Arrange & Act
    render(<InputGroup data-testid="group" />);

    // Assert
    expect(screen.getByTestId("group")).toBeInTheDocument();
  });
});
