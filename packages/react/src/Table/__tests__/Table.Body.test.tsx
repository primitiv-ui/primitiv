import { Table } from "../index.ts";
import { render, screen } from "@testing-library/react";

describe("Table.Body rendering", () => {
  it("should render tbody element", () => {
    // Arrange
    render(
      <table>
        <Table.Body />
      </table>,
    );
    const tbody = screen.getByRole("rowgroup");

    // Assert
    expect(tbody).toBeVisible();
  });

  it("should render children correctly", () => {
    // Arrange
    render(
      <table>
        <Table.Body>
          <tr>
            <td>Example text</td>
          </tr>
        </Table.Body>
      </table>,
    );
    const childElement = screen.getByText(/Example text/i);

    // Assert
    expect(childElement).toBeVisible();
  });

  it("should add className to tbody element", () => {
    // Arrange
    const testClass = "test-class";
    render(
      <table>
        <Table.Body className={testClass} />
      </table>,
    );
    const tbody = screen.getByRole("rowgroup");

    // Assert
    expect(tbody).toHaveClass(testClass);
  });

  it("should apply correct HTML attributes to tbody element", () => {
    // Arrange
    render(
      <table>
        <Table.Body id="test" />
      </table>,
    );
    const tbody = screen.getByRole("rowgroup");

    // Assert
    expect(tbody).toHaveAttribute("id", "test");
  });
});
