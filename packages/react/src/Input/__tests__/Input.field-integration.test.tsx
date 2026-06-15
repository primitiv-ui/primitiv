import { render, screen } from "@testing-library/react";

import { Field } from "../../Field/index.ts";
import { Input } from "../Input";

describe("Input — Field integration", () => {
  it("inherits the field id when no id prop is passed", () => {
    // Arrange & Act
    render(
      <Field.Root id="email">
        <Input aria-label="Email" />
      </Field.Root>,
    );

    // Assert
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute(
      "id",
      "email",
    );
  });

  it("consumer-supplied id wins over the field id", () => {
    // Arrange & Act
    render(
      <Field.Root id="email">
        <Input id="my-email" aria-label="Email" />
      </Field.Root>,
    );

    // Assert
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute(
      "id",
      "my-email",
    );
  });

  it("inherits aria-describedby pointing at the field's descriptionId", () => {
    // Arrange & Act
    render(
      <Field.Root id="email">
        <Input aria-label="Email" />
      </Field.Root>,
    );

    // Assert
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute(
      "aria-describedby",
      "email-description",
    );
  });

  it("includes the errorId in aria-describedby when the field is invalid", () => {
    // Arrange & Act
    render(
      <Field.Root id="email" invalid>
        <Input aria-label="Email" />
      </Field.Root>,
    );

    // Assert
    expect(
      screen.getByRole("textbox", { name: "Email" }).getAttribute(
        "aria-describedby",
      ),
    ).toBe("email-description email-error");
  });

  it("appends consumer-supplied aria-describedby to the field-supplied ids", () => {
    // Arrange & Act
    render(
      <Field.Root id="email">
        <Input aria-label="Email" aria-describedby="extra-hint" />
      </Field.Root>,
    );

    // Assert
    expect(
      screen.getByRole("textbox", { name: "Email" }).getAttribute(
        "aria-describedby",
      ),
    ).toBe("extra-hint email-description");
  });

  it("inherits aria-invalid='true' when the field is invalid", () => {
    // Arrange & Act
    render(
      <Field.Root id="email" invalid>
        <Input aria-label="Email" />
      </Field.Root>,
    );

    // Assert
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("does not set aria-invalid when the field is not invalid", () => {
    // Arrange & Act
    render(
      <Field.Root id="email">
        <Input aria-label="Email" />
      </Field.Root>,
    );

    // Assert
    expect(
      screen.getByRole("textbox", { name: "Email" }),
    ).not.toHaveAttribute("aria-invalid");
  });

  it("inherits disabled from the field", () => {
    // Arrange & Act
    render(
      <Field.Root id="email" disabled>
        <Input aria-label="Email" />
      </Field.Root>,
    );

    // Assert
    expect(screen.getByRole("textbox", { name: "Email" })).toBeDisabled();
  });

  it("inherits required from the field", () => {
    // Arrange & Act
    render(
      <Field.Root id="email" required>
        <Input aria-label="Email" />
      </Field.Root>,
    );

    // Assert
    expect(screen.getByRole("textbox", { name: "Email" })).toBeRequired();
  });

  it("Input outside Field.Root behaves identically to before — no field-derived attributes", () => {
    // Arrange & Act
    render(<Input aria-label="Email" />);
    const input = screen.getByRole("textbox", { name: "Email" });

    // Assert
    expect(input).not.toHaveAttribute("aria-describedby");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).not.toHaveAttribute("disabled");
    expect(input).not.toHaveAttribute("required");
  });
});
