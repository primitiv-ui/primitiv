import { render, screen } from "@testing-library/react";

import { Input } from "../Input";

describe("Input disabled state", () => {
  it("sets the native disabled attribute", () => {
    // Arrange & Act
    render(<Input aria-label="Email" disabled />);

    // Assert
    expect(screen.getByRole("textbox", { name: "Email" })).toBeDisabled();
  });

  it('sets data-disabled="" as a CSS styling hook', () => {
    // Arrange & Act
    render(<Input aria-label="Email" disabled />);

    // Assert
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute(
      "data-disabled",
      "",
    );
  });

  it("does not set data-disabled when not disabled", () => {
    // Arrange & Act
    render(<Input aria-label="Email" />);

    // Assert
    expect(
      screen.getByRole("textbox", { name: "Email" }),
    ).not.toHaveAttribute("data-disabled");
  });

  it("sets data-disabled on the child element when asChild and disabled", () => {
    // Arrange & Act
    render(
      <Input asChild aria-label="Email" disabled>
        <input />
      </Input>,
    );

    // Assert
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute(
      "data-disabled",
      "",
    );
  });
});
