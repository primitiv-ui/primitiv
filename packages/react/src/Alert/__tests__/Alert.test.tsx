import { Alert } from "..";
import { render, screen } from "@testing-library/react";

describe("Alert component", () => {
  it("should render a div with role alert containing its children", () => {
    // Arrange
    render(<Alert>Your changes could not be saved</Alert>);

    // Assert
    const alert = screen.getByRole("alert");
    expect(alert.tagName).toBe("DIV");
    expect(alert).toHaveTextContent("Your changes could not be saved");
  });
});
