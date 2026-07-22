import { EmptyState } from "../index.ts";
import { render, screen } from "@testing-library/react";

describe("EmptyState.Title component", () => {
  it("should render a paragraph containing its children", () => {
    // Arrange
    render(<EmptyState.Title>No results found</EmptyState.Title>);

    // Assert
    const title = screen.getByText("No results found");
    expect(title.tagName).toBe("P");
  });

  it("should render the consumer element with asChild", () => {
    // Arrange
    const { container } = render(
      <EmptyState.Title asChild>
        <h2>No results found</h2>
      </EmptyState.Title>,
    );

    // Assert
    const title = screen.getByRole("heading", { name: "No results found" });
    expect(title.tagName).toBe("H2");
    // Slot renders the child in place — no default <p> wrapper around it.
    expect(container.querySelector("p")).toBeNull();
  });
});
