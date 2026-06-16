import { Table } from "../index.ts";
import { render, screen } from "@testing-library/react";

describe("Table.Footer rendering", () => {
  it("should render tfoot element", () => {
    // Arrange
    render(
      <table>
        <Table.Footer />
      </table>,
    );
    const tfoot = screen.getByRole("rowgroup");

    // Assert
    expect(tfoot).toBeVisible();
  });

  it("should render children correctly", () => {
    // Arrange
    render(
      <table>
        <Table.Footer>
          <tr>
            <th>Example text</th>
          </tr>
        </Table.Footer>
      </table>,
    );
    const childElement = screen.getByText(/Example text/i);

    // Assert
    expect(childElement).toBeVisible();
  });

  it("should add className to tfoot element", () => {
    // Arrange
    const testClass = "test-class";
    render(
      <table>
        <Table.Footer className={testClass} />
      </table>,
    );
    const tfoot = screen.getByRole("rowgroup");

    // Assert
    expect(tfoot).toHaveClass(testClass);
  });

  it("should apply correct HTML attributes to tfoot element", () => {
    // Arrange
    render(
      <table>
        <Table.Footer id="test" />
      </table>,
    );
    const tfoot = screen.getByRole("rowgroup");

    // Assert
    expect(tfoot).toHaveAttribute("id", "test");
  });
});
