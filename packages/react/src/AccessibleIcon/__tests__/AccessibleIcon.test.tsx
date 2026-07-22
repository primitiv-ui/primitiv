import { AccessibleIcon } from "../index.ts";
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

  it("should mark the icon child as non-focusable", () => {
    // Arrange
    render(
      <AccessibleIcon label="Search">
        <svg data-testid="icon" />
      </AccessibleIcon>,
    );

    // Assert
    expect(screen.getByTestId("icon")).toHaveAttribute(
      "focusable",
      "false",
    );
  });

  it("should render the label in a visually hidden span", () => {
    // Arrange
    render(
      <AccessibleIcon label="Search">
        <svg data-testid="icon" />
      </AccessibleIcon>,
    );

    // Assert
    const label = screen.getByText("Search");
    expect(label).toHaveStyle({ position: "absolute", overflow: "hidden" });
  });

  it('sets displayName to "AccessibleIcon" for React DevTools and stack traces', () => {
    // Assert — an empty displayName would render it as an anonymous component.
    expect(AccessibleIcon.displayName).toBe("AccessibleIcon");
  });
});
