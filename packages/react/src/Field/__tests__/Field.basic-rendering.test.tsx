import { render, screen } from "@testing-library/react";

import { Field } from "../Field";

describe("Field basic rendering", () => {
  it("renders a wrapper element", () => {
    // Arrange & Act
    render(<Field.Root data-testid="field" />);

    // Assert
    expect(screen.getByTestId("field")).toBeInTheDocument();
  });
});
