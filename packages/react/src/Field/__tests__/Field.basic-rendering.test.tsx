import { render, screen } from "@testing-library/react";

import { Field } from "../Field";

describe("Field basic rendering", () => {
  it("renders a wrapper element with data-field on the root", () => {
    // Arrange & Act
    render(<Field.Root data-testid="field" />);

    // Assert
    const root = screen.getByTestId("field");
    expect(root.tagName).toBe("DIV");
    expect(root).toHaveAttribute("data-field", "");
  });

  it("Field is callable as an alias of Field.Root", () => {
    // Arrange & Act
    render(<Field data-testid="field" />);

    // Assert
    expect(screen.getByTestId("field").tagName).toBe("DIV");
  });

  it("Field.Label renders a <label> wired to an auto-generated id", () => {
    // Arrange & Act
    render(
      <Field.Root>
        <Field.Label>Email</Field.Label>
      </Field.Root>,
    );
    const label = screen.getByText("Email");

    // Assert
    expect(label.tagName).toBe("LABEL");
    expect(label).toHaveAttribute("for");
    expect(label.getAttribute("for")).toBeTruthy();
  });

  it("Field.Label uses a consumer-supplied id on Root", () => {
    // Arrange & Act
    render(
      <Field.Root id="email">
        <Field.Label>Email</Field.Label>
      </Field.Root>,
    );

    // Assert
    expect(screen.getByText("Email")).toHaveAttribute("for", "email");
  });

  it("Field.Description renders a <div> with id derived from the field id", () => {
    // Arrange & Act
    render(
      <Field.Root id="email">
        <Field.Description>We won't share it.</Field.Description>
      </Field.Root>,
    );

    // Assert
    expect(screen.getByText("We won't share it.")).toHaveAttribute(
      "id",
      "email-description",
    );
  });

  it("Field.ErrorText renders a <div role='alert'> with derived id", () => {
    // Arrange & Act
    render(
      <Field.Root id="email">
        <Field.ErrorText>Required.</Field.ErrorText>
      </Field.Root>,
    );
    const error = screen.getByText("Required.");

    // Assert
    expect(error.tagName).toBe("DIV");
    expect(error).toHaveAttribute("role", "alert");
    expect(error).toHaveAttribute("id", "email-error");
  });

  it("renders children inside the wrapper in source order", () => {
    // Arrange & Act
    render(
      <Field.Root id="email">
        <Field.Label>Email</Field.Label>
        <input data-testid="input" />
        <Field.Description>Hint.</Field.Description>
      </Field.Root>,
    );
    const wrapper = screen.getByText("Email").parentElement;

    // Assert
    expect(wrapper).toContainElement(screen.getByTestId("input"));
    expect(wrapper).toContainElement(screen.getByText("Hint."));
  });

  it("passes className and data-* through on the Root", () => {
    // Arrange & Act
    render(<Field.Root className="form-field" data-testid="field" />);

    // Assert
    expect(screen.getByTestId("field")).toHaveClass("form-field");
  });
});
