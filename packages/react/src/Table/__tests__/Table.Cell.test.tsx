import { Table } from "../index.ts";
import { render, screen } from "@testing-library/react";

describe("Table.Cell rendering", () => {
  it("should render td element", () => {
    // Arrange
    render(
      <table>
        <tbody>
          <tr>
            <Table.Cell />
          </tr>
        </tbody>
      </table>,
    );
    const td = screen.getByRole("cell");

    // Assert
    expect(td).toBeVisible();
  });

  it("should render children correctly", () => {
    // Arrange
    render(
      <table>
        <tbody>
          <tr>
            <Table.Cell>Example text</Table.Cell>
          </tr>
        </tbody>
      </table>,
    );
    const childElement = screen.getByText(/Example text/i);

    // Assert
    expect(childElement).toBeVisible();
  });

  it("should add className to td element", () => {
    // Arrange
    const testClass = "test-class";
    render(
      <table>
        <tbody>
          <tr>
            <Table.Cell className={testClass} />
          </tr>
        </tbody>
      </table>,
    );
    const td = screen.getByRole("cell");

    // Assert
    expect(td).toHaveClass(testClass);
  });

  it("should apply correct HTML attributes to td element", () => {
    // Arrange
    render(
      <table>
        <tbody>
          <tr>
            <Table.Cell id="test" />
          </tr>
        </tbody>
      </table>,
    );
    const td = screen.getByRole("cell");

    // Assert
    expect(td).toHaveAttribute("id", "test");
  });
});
