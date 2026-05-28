import { render, screen } from "@testing-library/react";

import { Field } from "../Field";

describe("Field asChild composition", () => {
  it("Root asChild renders the consumer element with data-field merged on", () => {
    // Arrange & Act
    render(
      <Field.Root asChild data-testid="field">
        <fieldset />
      </Field.Root>,
    );
    const root = screen.getByTestId("field");

    // Assert
    expect(root.tagName).toBe("FIELDSET");
    expect(root).toHaveAttribute("data-field", "");
  });

  it("Root asChild keeps data-field-invalid when invalid", () => {
    // Arrange & Act
    render(
      <Field.Root asChild data-testid="field" invalid>
        <section />
      </Field.Root>,
    );

    // Assert
    expect(screen.getByTestId("field")).toHaveAttribute(
      "data-field-invalid",
      "",
    );
  });

  it("Label asChild renders the consumer element with htmlFor merged on", () => {
    // Arrange & Act
    render(
      <Field.Root id="email">
        <Field.Label asChild>
          <span data-testid="label">Email</span>
        </Field.Label>
      </Field.Root>,
    );
    const label = screen.getByTestId("label");

    // Assert
    expect(label.tagName).toBe("SPAN");
    expect(label).toHaveAttribute("for", "email");
  });

  it("Description asChild renders the consumer element with id merged on", () => {
    // Arrange & Act
    render(
      <Field.Root id="email">
        <Field.Description asChild>
          <p data-testid="hint">We won't share it.</p>
        </Field.Description>
      </Field.Root>,
    );
    const description = screen.getByTestId("hint");

    // Assert
    expect(description.tagName).toBe("P");
    expect(description).toHaveAttribute("id", "email-description");
  });

  it("ErrorText asChild renders the consumer element with id and role merged on", () => {
    // Arrange & Act
    render(
      <Field.Root id="email" invalid>
        <Field.ErrorText asChild>
          <p data-testid="error">Required.</p>
        </Field.ErrorText>
      </Field.Root>,
    );
    const error = screen.getByTestId("error");

    // Assert
    expect(error.tagName).toBe("P");
    expect(error).toHaveAttribute("id", "email-error");
    expect(error).toHaveAttribute("role", "alert");
  });
});
