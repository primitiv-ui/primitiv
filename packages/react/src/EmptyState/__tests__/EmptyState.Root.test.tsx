import { EmptyState } from "../index.ts";
import { render, screen } from "@testing-library/react";

describe("EmptyState.Root component", () => {
  it("should render a div with role status containing its children", () => {
    // Arrange
    render(<EmptyState.Root>No projects yet</EmptyState.Root>);

    // Assert
    const root = screen.getByRole("status");
    expect(root.tagName).toBe("DIV");
    expect(root).toHaveTextContent("No projects yet");
  });

  it("should render the consumer element with asChild, keeping role status", () => {
    // Arrange
    render(
      <EmptyState.Root asChild>
        <section>No projects yet</section>
      </EmptyState.Root>,
    );

    // Assert
    const root = screen.getByRole("status");
    expect(root.tagName).toBe("SECTION");
    expect(root).toHaveTextContent("No projects yet");
  });
});
