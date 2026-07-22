import { EmptyState } from "../index.ts";
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
    const { container } = render(
      <EmptyState.Description asChild>
        <span>Try adjusting your filters.</span>
      </EmptyState.Description>,
    );

    // Assert
    const description = screen.getByText("Try adjusting your filters.");
    expect(description.tagName).toBe("SPAN");
    // Slot renders the child in place — no default <p> wrapper around it.
    expect(container.querySelector("p")).toBeNull();
  });
});
