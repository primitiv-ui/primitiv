import { VisuallyHidden } from "..";
import { render, screen } from "@testing-library/react";

describe("VisuallyHidden component", () => {
  it("should render a span containing its children", () => {
    // Arrange
    render(<VisuallyHidden>Loading complete</VisuallyHidden>);

    // Assert
    const hidden = screen.getByText("Loading complete");
    expect(hidden.tagName).toBe("SPAN");
  });
});
