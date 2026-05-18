import { Status } from "..";
import { render, screen } from "@testing-library/react";

describe("Status component", () => {
  it("should render a div with role status containing its children", () => {
    // Arrange
    render(<Status>3 items added to your cart</Status>);

    // Assert
    const status = screen.getByRole("status");
    expect(status.tagName).toBe("DIV");
    expect(status).toHaveTextContent("3 items added to your cart");
  });
});
