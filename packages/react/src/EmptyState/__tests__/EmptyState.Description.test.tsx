import { EmptyState } from "..";
import { render, screen } from "@testing-library/react";

describe("EmptyState.Description component", () => {
  it("should render a paragraph containing its children", () => {
    // Arrange
    render(
      <EmptyState.Description>
        Try adjusting your filters.
      </EmptyState.Description>,
    );

    // Assert
    const description = screen.getByText("Try adjusting your filters.");
    expect(description.tagName).toBe("P");
  });

  it("should render the consumer element with asChild", () => {
    // Arrange
    render(
      <EmptyState.Description asChild>
        <span>Try adjusting your filters.</span>
      </EmptyState.Description>,
    );

    // Assert
    const description = screen.getByText("Try adjusting your filters.");
    expect(description.tagName).toBe("SPAN");
  });
});
