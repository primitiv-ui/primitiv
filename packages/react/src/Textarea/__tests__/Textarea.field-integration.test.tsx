import { render, screen } from "@testing-library/react";

import { Field } from "../../Field/index.ts";
import { Textarea } from "../Textarea";

describe("Textarea — Field integration", () => {
  it("inherits the field id when no id prop is passed", () => {
    // Arrange & Act
    render(
      <Field.Root id="bio">
        <Textarea aria-label="Bio" />
      </Field.Root>,
    );

    // Assert
    expect(screen.getByRole("textbox", { name: "Bio" })).toHaveAttribute(
      "id",
      "bio",
    );
  });

  it("consumer-supplied id wins over the field id", () => {
    // Arrange & Act
    render(
      <Field.Root id="bio">
        <Textarea id="my-bio" aria-label="Bio" />
      </Field.Root>,
    );

    // Assert
    expect(screen.getByRole("textbox", { name: "Bio" })).toHaveAttribute(
      "id",
      "my-bio",
    );
  });

  it("inherits aria-describedby pointing at the field's descriptionId", () => {
    // Arrange & Act
    render(
      <Field.Root id="bio">
        <Textarea aria-label="Bio" />
      </Field.Root>,
    );

    // Assert
    expect(screen.getByRole("textbox", { name: "Bio" })).toHaveAttribute(
      "aria-describedby",
      "bio-description",
    );
  });

  it("includes the errorId in aria-describedby when the field is invalid", () => {
    // Arrange & Act
    render(
      <Field.Root id="bio" invalid>
        <Textarea aria-label="Bio" />
      </Field.Root>,
    );

    // Assert
    expect(
      screen.getByRole("textbox", { name: "Bio" }).getAttribute(
        "aria-describedby",
      ),
    ).toBe("bio-description bio-error");
  });

  it("appends consumer-supplied aria-describedby to the field-supplied ids", () => {
    // Arrange & Act
    render(
      <Field.Root id="bio">
        <Textarea aria-label="Bio" aria-describedby="extra-hint" />
      </Field.Root>,
    );

    // Assert
    expect(
      screen.getByRole("textbox", { name: "Bio" }).getAttribute(
        "aria-describedby",
      ),
    ).toBe("extra-hint bio-description");
  });

  it("inherits aria-invalid='true' when the field is invalid", () => {
    // Arrange & Act
    render(
      <Field.Root id="bio" invalid>
        <Textarea aria-label="Bio" />
      </Field.Root>,
    );

    // Assert
    expect(screen.getByRole("textbox", { name: "Bio" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("inherits disabled from the field", () => {
    // Arrange & Act
    render(
      <Field.Root id="bio" disabled>
        <Textarea aria-label="Bio" />
      </Field.Root>,
    );

    // Assert
    expect(screen.getByRole("textbox", { name: "Bio" })).toBeDisabled();
  });

  it("inherits required from the field", () => {
    // Arrange & Act
    render(
      <Field.Root id="bio" required>
        <Textarea aria-label="Bio" />
      </Field.Root>,
    );

    // Assert
    expect(screen.getByRole("textbox", { name: "Bio" })).toBeRequired();
  });

  it("Textarea outside Field.Root behaves identically to before — no field-derived attributes", () => {
    // Arrange & Act
    render(<Textarea aria-label="Bio" />);
    const textarea = screen.getByRole("textbox", { name: "Bio" });

    // Assert
    expect(textarea).not.toHaveAttribute("aria-describedby");
    expect(textarea).not.toHaveAttribute("aria-invalid");
    expect(textarea).not.toHaveAttribute("disabled");
    expect(textarea).not.toHaveAttribute("required");
  });
});
