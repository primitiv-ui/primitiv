import { Table } from "../index.ts";
import { render, screen } from "@testing-library/react";

describe("Table.Caption rendering", () => {
  it("should render caption element", () => {
    // Arrange
    render(
      <table>
        <Table.Caption>Example caption</Table.Caption>
      </table>,
    );
    const caption = screen.getByRole("caption", { name: /Example caption/i });

    // Assert
    expect(caption).toBeVisible();
  });

  it("should apply correct HTML attributes to caption element", () => {
    // Arrange
    render(
      <table>
        <Table.Caption id="test">Example caption</Table.Caption>
      </table>,
    );
    const caption = screen.getByRole("caption");

    // Assert
    expect(caption).toHaveAttribute("id", "test");
  });

  it('should render a caption element with a caption-side property of "bottom" by default', () => {
    // Arrange
    render(
      <table>
        <Table.Caption>Example caption</Table.Caption>
      </table>,
    );
    const caption = screen.getByRole("caption");

    // Assert
    expect(caption.style.captionSide).toBe("bottom");
  });

  it("should allow overriding of the caption-side style via props", () => {
    // Arrange
    render(
      <table>
        <Table.Caption captionSide="top">Example caption</Table.Caption>
      </table>,
    );
    const caption = screen.getByRole("caption");

    // Assert
    expect(caption.style.captionSide).toBe("top");
  });

  it("should add className to the scrollable container", () => {
    // Arrange
    const testClass = "test-class";
    render(
      <table>
        <Table.Caption className={testClass}>Example caption</Table.Caption>
      </table>,
    );
    const caption = screen.getByRole("caption");

    // Assert
    expect(caption).toHaveClass(testClass);
  });
});
