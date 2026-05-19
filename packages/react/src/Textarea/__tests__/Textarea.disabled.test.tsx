import { render, screen } from "@testing-library/react";

import { Textarea } from "../Textarea";

describe("Textarea disabled state", () => {
  it("sets the native disabled attribute", () => {
    // Arrange & Act
    render(<Textarea aria-label="Notes" disabled />);

    // Assert
    expect(screen.getByRole("textbox", { name: "Notes" })).toBeDisabled();
  });

  it('sets data-disabled="" as a CSS styling hook', () => {
    // Arrange & Act
    render(<Textarea aria-label="Notes" disabled />);

    // Assert
    expect(screen.getByRole("textbox", { name: "Notes" })).toHaveAttribute(
      "data-disabled",
      "",
    );
  });

  it("does not set data-disabled when not disabled", () => {
    // Arrange & Act
    render(<Textarea aria-label="Notes" />);

    // Assert
    expect(
      screen.getByRole("textbox", { name: "Notes" }),
    ).not.toHaveAttribute("data-disabled");
  });

  it("sets data-disabled on the child element when asChild and disabled", () => {
    // Arrange & Act
    render(
      <Textarea asChild aria-label="Notes" disabled>
        <textarea />
      </Textarea>,
    );

    // Assert
    expect(screen.getByRole("textbox", { name: "Notes" })).toHaveAttribute(
      "data-disabled",
      "",
    );
  });
});
