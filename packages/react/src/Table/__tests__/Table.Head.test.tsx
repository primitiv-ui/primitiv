import { Table } from "../index.ts";
import { render, screen } from "@testing-library/react";

describe("Table.Head rendering", () => {
  it("should render thead element", () => {
    // Arrange
    render(
      <table>
        <Table.Head />
      </table>,
    );
    const thead = screen.getByRole("rowgroup");

    // Assert
    expect(thead).toBeVisible();
  });

  it("should render children correctly", () => {
    // Arrange
    render(
      <table>
        <Table.Head>
          <tr>
            <th>Example text</th>
          </tr>
        </Table.Head>
      </table>,
    );
    const childElement = screen.getByText(/Example text/i);

    // Assert
    expect(childElement).toBeVisible();
  });

  it("should add className to thead element", () => {
    // Arrange
    const testClass = "test-class";
    render(
      <table>
        <Table.Head className={testClass} />
      </table>,
    );
    const thead = screen.getByRole("rowgroup");

    // Assert
    expect(thead).toHaveClass(testClass);
  });

  it("should apply correct HTML attributes to thead element", () => {
    // Arrange
    render(
      <table>
        <Table.Head id="test" />
      </table>,
    );
    const thead = screen.getByRole("rowgroup");

    // Assert
    expect(thead).toHaveAttribute("id", "test");
  });
});
