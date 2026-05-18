import { AccessibleIcon } from "..";
import { render, screen } from "@testing-library/react";

describe("AccessibleIcon component", () => {
  it("should mark the icon child as aria-hidden", () => {
    // Arrange
    render(
      <AccessibleIcon label="Search">
        <svg data-testid="icon" />
      </AccessibleIcon>,
    );

    // Assert
    expect(screen.getByTestId("icon")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
