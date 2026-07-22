import { render, screen } from "@testing-library/react";

import { CheckboxCard } from "../CheckboxCard";

describe("CheckboxCard basic rendering", () => {
  it('renders a <button role="checkbox"> by default', () => {
    // Arrange & Act
    render(<CheckboxCard.Root aria-label="Enable feature" />);
    const card = screen.getByRole("checkbox", { name: "Enable feature" });

    // Assert
    expect(card.tagName).toBe("BUTTON");
  });

  it('sets type="button" so it never submits an enclosing form', () => {
    // Arrange & Act
    render(<CheckboxCard.Root aria-label="Enable feature" />);

    // Assert
    expect(
      screen.getByRole("checkbox", { name: "Enable feature" }),
    ).toHaveAttribute("type", "button");
  });

  it('defaults aria-checked="false" when unchecked', () => {
    // Arrange & Act
    render(<CheckboxCard.Root aria-label="Enable feature" />);

    // Assert
    expect(
      screen.getByRole("checkbox", { name: "Enable feature" }),
    ).toHaveAttribute("aria-checked", "false");
  });

  it('sets data-state="unchecked" by default', () => {
    // Arrange & Act
    render(<CheckboxCard.Root aria-label="Enable feature" />);

    // Assert
    expect(
      screen.getByRole("checkbox", { name: "Enable feature" }),
    ).toHaveAttribute("data-state", "unchecked");
  });

  it("renders children inside the card", () => {
    // Arrange & Act
    render(
      <CheckboxCard.Root aria-label="Enable feature">
        <span data-testid="icon">icon</span>
        <h3>Feature name</h3>
      </CheckboxCard.Root>,
    );

    // Assert
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByText("Feature name")).toBeInTheDocument();
  });

  it("sets a displayName on the compound and the Indicator", () => {
    // Assert — empty displayNames would render each as anonymous in DevTools.
    // Root aliases the compound (Object.assign), so its name is "CheckboxCard".
    expect(CheckboxCard.displayName).toBe("CheckboxCard");
    expect(CheckboxCard.Indicator.displayName).toBe("CheckboxCardIndicator");
  });
});
