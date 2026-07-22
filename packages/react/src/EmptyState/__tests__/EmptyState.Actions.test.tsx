import { EmptyState } from "../index.ts";
import { render, screen } from "@testing-library/react";

describe("EmptyState.Actions component", () => {
  it("should render a div containing its children", () => {
    // Arrange
    const { container } = render(
      <EmptyState.Actions>
        <button>Clear filters</button>
      </EmptyState.Actions>,
    );

    // Assert
    const button = screen.getByRole("button", { name: "Clear filters" });
    expect(button.parentElement?.tagName).toBe("DIV");
    // The wrapping <div> is Actions' own render root (default is not asChild),
    // not the test container.
    expect((container.firstChild as HTMLElement).tagName).toBe("DIV");
  });

  it("should render the consumer element with asChild", () => {
    // Arrange
    const { container } = render(
      <EmptyState.Actions asChild>
        <nav>
          <button>Clear filters</button>
        </nav>
      </EmptyState.Actions>,
    );

    // Assert
    const button = screen.getByRole("button", { name: "Clear filters" });
    expect(button.parentElement?.tagName).toBe("NAV");
    // Slot renders the <nav> in place — no default <div> wrapper around it.
    expect(container.querySelector("div")).toBeNull();
  });
});
