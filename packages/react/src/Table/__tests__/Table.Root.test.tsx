import { Table } from "../index.ts";
import { render, screen } from "@testing-library/react";

describe("Table.Root rendering", () => {
  it("should render table element", () => {
    // Arrange
    render(<Table.Root />);
    const table = screen.getByRole("table");

    // Assert
    expect(table).toBeVisible();
  });

  it("should render children correctly", () => {
    // Arrange
    render(
      <Table.Root>
        <thead>
          <tr>
            <th>Example text</th>
          </tr>
        </thead>
      </Table.Root>,
    );
    const childElement = screen.getByText(/Example text/i);

    // Assert
    expect(childElement).toBeVisible();
  });

  it("should add className to table element", () => {
    // Arrange
    const testClass = "test-class";
    render(<Table.Root className={testClass} />);
    const table = screen.getByRole("table");

    // Assert
    expect(table).toHaveClass(testClass);
  });

  it("should apply correct HTML attributes to table element", () => {
    // Arrange
    render(<Table.Root id="test" />);
    const table = screen.getByRole("table");

    // Assert
    expect(table).toHaveAttribute("id", "test");
  });
});
