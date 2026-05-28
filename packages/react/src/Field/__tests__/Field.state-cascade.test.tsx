import { render, screen } from "@testing-library/react";

import { Field } from "../Field";

describe("Field state cascade", () => {
  it("sets data-field-invalid='' on the root when invalid", () => {
    // Arrange & Act
    render(<Field.Root data-testid="field" invalid />);

    // Assert
    expect(screen.getByTestId("field")).toHaveAttribute(
      "data-field-invalid",
      "",
    );
  });

  it("sets data-field-disabled='' on the root when disabled", () => {
    // Arrange & Act
    render(<Field.Root data-testid="field" disabled />);

    // Assert
    expect(screen.getByTestId("field")).toHaveAttribute(
      "data-field-disabled",
      "",
    );
  });

  it("sets data-field-required='' on the root when required", () => {
    // Arrange & Act
    render(<Field.Root data-testid="field" required />);

    // Assert
    expect(screen.getByTestId("field")).toHaveAttribute(
      "data-field-required",
      "",
    );
  });

  it("does not set state data-* attributes when the corresponding flag is false", () => {
    // Arrange & Act
    render(<Field.Root data-testid="field" />);
    const root = screen.getByTestId("field");

    // Assert
    expect(root).not.toHaveAttribute("data-field-invalid");
    expect(root).not.toHaveAttribute("data-field-disabled");
    expect(root).not.toHaveAttribute("data-field-required");
  });

  it("Field.ErrorText returns null when invalid=false", () => {
    // Arrange & Act
    render(
      <Field.Root>
        <Field.ErrorText>You should not see this.</Field.ErrorText>
      </Field.Root>,
    );

    // Assert
    expect(
      screen.queryByText("You should not see this."),
    ).not.toBeInTheDocument();
  });

  it("Field.ErrorText renders when invalid=true", () => {
    // Arrange & Act
    render(
      <Field.Root invalid>
        <Field.ErrorText>Required.</Field.ErrorText>
      </Field.Root>,
    );

    // Assert
    expect(screen.getByText("Required.")).toBeInTheDocument();
  });
});
