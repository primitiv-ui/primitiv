import { Table } from "../index.ts";
import { render, screen } from "@testing-library/react";

describe("Table.ScrollArea rendering", () => {
  it("should render the table element as children", () => {
    // Arrange
    render(
      <Table.ScrollArea>
        <Table.Root />
      </Table.ScrollArea>,
    );
    const table = screen.getByRole("table");

    // Assert
    expect(table).toBeVisible();
  });

  it("should render a scrollable container with automatic overflow on the x-axis", () => {
    // Arrange
    render(
      <Table.ScrollArea>
        <Table.Root />
      </Table.ScrollArea>,
    );
    const scrollArea = screen.getByRole("table").parentElement;

    // Assert
    expect(scrollArea?.style.overflowX).toBe("auto");
  });

  it('should render a scrollable container with a "display: block" style applied', () => {
    // Arrange
    render(
      <Table.ScrollArea>
        <Table.Root />
      </Table.ScrollArea>,
    );
    const scrollArea = screen.getByRole("table").parentElement;

    // Assert
    expect(scrollArea?.style.display).toBe("block");
  });

  it('should render a scrollable container with a "maxWidth: 100%" style applied', () => {
    // Arrange
    render(
      <Table.ScrollArea>
        <Table.Root />
      </Table.ScrollArea>,
    );
    const scrollArea = screen.getByRole("table").parentElement;

    // Assert
    expect(scrollArea).toHaveStyle({ maxWidth: "100%" });
  });

  it("should preserve base scroll styles when a custom style prop is passed", () => {
    // Arrange
    render(
      <Table.ScrollArea style={{ color: "red" }}>
        <Table.Root />
      </Table.ScrollArea>,
    );
    const scrollArea = screen.getByRole("table").parentElement;

    // Assert
    expect(scrollArea?.style.overflowX).toBe("auto");
  });

  it("should add className to the scrollable container", () => {
    // Arrange
    const testClass = "test-class";
    render(
      <Table.ScrollArea className={testClass}>
        <Table.Root />
      </Table.ScrollArea>,
    );
    const scrollArea = screen.getByRole("table").parentElement;

    // Assert
    expect(scrollArea).toHaveClass(testClass);
  });
});
