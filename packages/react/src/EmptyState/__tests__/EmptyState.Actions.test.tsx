import { EmptyState } from "../index.ts";
import { render, screen } from "@testing-library/react";

describe("EmptyState.Actions component", () => {
  it("should render a div containing its children", () => {
    // Arrange
    render(
      <EmptyState.Actions>
        <button>Clear filters</button>
      </EmptyState.Actions>,
    );

    // Assert
    const button = screen.getByRole("button", { name: "Clear filters" });
    expect(button.parentElement?.tagName).toBe("DIV");
  });

  it("should render the consumer element with asChild", () => {
    // Arrange
    render(
      <EmptyState.Actions asChild>
        <nav>
          <button>Clear filters</button>
        </nav>
      </EmptyState.Actions>,
    );

    // Assert
    const button = screen.getByRole("button", { name: "Clear filters" });
    expect(button.parentElement?.tagName).toBe("NAV");
  });
});
