import { Table } from "../index.ts";
import { render, screen } from "@testing-library/react";

describe("Table.Header rendering", () => {
  it("should render th element", () => {
    // Arrange
    render(
      <table>
        <thead>
          <tr>
            <Table.Header />
          </tr>
        </thead>
      </table>,
    );
    const th = screen.getByRole("columnheader");

    // Assert
    expect(th).toBeVisible();
  });

  it("should render children correctly", () => {
    // Arrange
    render(
      <table>
        <thead>
          <tr>
            <Table.Header>Example text</Table.Header>
          </tr>
        </thead>
      </table>,
    );
    const childElement = screen.getByText(/Example text/i);

    // Assert
    expect(childElement).toBeVisible();
  });

  it("should add className to th element", () => {
    // Arrange
    const testClass = "test-class";
    render(
      <table>
        <thead>
          <tr>
            <Table.Header className={testClass} />
          </tr>
        </thead>
      </table>,
    );
    const th = screen.getByRole("columnheader");

    // Assert
    expect(th).toHaveClass(testClass);
  });

  it("should apply correct HTML attributes to th element", () => {
    // Arrange
    render(
      <table>
        <thead>
          <tr>
            <Table.Header id="test" />
          </tr>
        </thead>
      </table>,
    );
    const th = screen.getByRole("columnheader");

    // Assert
    expect(th).toHaveAttribute("id", "test");
  });
});
