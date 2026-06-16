import { render, screen } from "@testing-library/react";

import { Field } from "../../Field/index.ts";
import { Select } from "../Select";

function renderSelect(children?: React.ReactNode) {
  return (
    <>
      {children}
      <Select.Option value="apple">Apple</Select.Option>
      <Select.Option value="banana">Banana</Select.Option>
    </>
  );
}

describe("Select — Field integration", () => {
  it("inherits the field id when no id prop is passed", () => {
    // Arrange & Act
    render(
      <Field.Root id="fruit">
        <Select.Root aria-label="Fruit">{renderSelect()}</Select.Root>
      </Field.Root>,
    );

    // Assert
    expect(screen.getByRole("combobox", { name: "Fruit" })).toHaveAttribute(
      "id",
      "fruit",
    );
  });

  it("consumer-supplied id wins over the field id", () => {
    // Arrange & Act
    render(
      <Field.Root id="fruit">
        <Select.Root id="my-fruit" aria-label="Fruit">
          {renderSelect()}
        </Select.Root>
      </Field.Root>,
    );

    // Assert
    expect(screen.getByRole("combobox", { name: "Fruit" })).toHaveAttribute(
      "id",
      "my-fruit",
    );
  });

  it("inherits aria-describedby pointing at the field's descriptionId", () => {
    // Arrange & Act
    render(
      <Field.Root id="fruit">
        <Select.Root aria-label="Fruit">{renderSelect()}</Select.Root>
      </Field.Root>,
    );

    // Assert
    expect(screen.getByRole("combobox", { name: "Fruit" })).toHaveAttribute(
      "aria-describedby",
      "fruit-description",
    );
  });

  it("includes the errorId in aria-describedby when the field is invalid", () => {
    // Arrange & Act
    render(
      <Field.Root id="fruit" invalid>
        <Select.Root aria-label="Fruit">{renderSelect()}</Select.Root>
      </Field.Root>,
    );

    // Assert
    expect(
      screen
        .getByRole("combobox", { name: "Fruit" })
        .getAttribute("aria-describedby"),
    ).toBe("fruit-description fruit-error");
  });

  it("appends consumer-supplied aria-describedby to the field-supplied ids", () => {
    // Arrange & Act
    render(
      <Field.Root id="fruit">
        <Select.Root aria-label="Fruit" aria-describedby="extra-hint">
          {renderSelect()}
        </Select.Root>
      </Field.Root>,
    );

    // Assert
    expect(
      screen
        .getByRole("combobox", { name: "Fruit" })
        .getAttribute("aria-describedby"),
    ).toBe("extra-hint fruit-description");
  });

  it("inherits aria-invalid='true' when the field is invalid", () => {
    // Arrange & Act
    render(
      <Field.Root id="fruit" invalid>
        <Select.Root aria-label="Fruit">{renderSelect()}</Select.Root>
      </Field.Root>,
    );

    // Assert
    expect(screen.getByRole("combobox", { name: "Fruit" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("inherits disabled from the field", () => {
    // Arrange & Act
    render(
      <Field.Root id="fruit" disabled>
        <Select.Root aria-label="Fruit">{renderSelect()}</Select.Root>
      </Field.Root>,
    );

    // Assert
    expect(screen.getByRole("combobox", { name: "Fruit" })).toBeDisabled();
  });

  it("inherits required from the field", () => {
    // Arrange & Act
    render(
      <Field.Root id="fruit" required>
        <Select.Root aria-label="Fruit">{renderSelect()}</Select.Root>
      </Field.Root>,
    );

    // Assert
    expect(screen.getByRole("combobox", { name: "Fruit" })).toBeRequired();
  });

  it("Select outside Field.Root behaves identically to before — no field-derived attributes", () => {
    // Arrange & Act
    render(
      <Select.Root aria-label="Fruit">{renderSelect()}</Select.Root>,
    );
    const select = screen.getByRole("combobox", { name: "Fruit" });

    // Assert
    expect(select).not.toHaveAttribute("aria-describedby");
    expect(select).not.toHaveAttribute("aria-invalid");
    expect(select).not.toHaveAttribute("disabled");
    expect(select).not.toHaveAttribute("required");
  });
});
