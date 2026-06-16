import { Table } from "../index.ts";
import { render, screen } from "@testing-library/react";

describe("Table.Row rendering", () => {
  it("should render tr element", () => {
    // Arrange
    render(
      <table>
        <tbody>
          <Table.Row />
        </tbody>
      </table>,
    );
    const tr = screen.getByRole("row");

    // Assert
    expect(tr).toBeVisible();
  });

  it("should render children correctly", () => {
    // Arrange
    render(
      <table>
        <tbody>
          <Table.Row>
            <th>Example text</th>
          </Table.Row>
        </tbody>
      </table>,
    );
    const childElement = screen.getByText(/Example text/i);

    // Assert
    expect(childElement).toBeVisible();
  });

  it("should add className to tr element", () => {
    // Arrange
    const testClass = "test-class";
    render(
      <table>
        <tbody>
          <Table.Row className={testClass} />
        </tbody>
      </table>,
    );
    const tr = screen.getByRole("row");

    // Assert
    expect(tr).toHaveClass(testClass);
  });

  it("should apply correct HTML attributes to tr element", () => {
    // Arrange
    render(
      <table>
        <tbody>
          <Table.Row id="test" />
        </tbody>
      </table>,
    );
    const tr = screen.getByRole("row");

    // Assert
    expect(tr).toHaveAttribute("id", "test");
  });
});
