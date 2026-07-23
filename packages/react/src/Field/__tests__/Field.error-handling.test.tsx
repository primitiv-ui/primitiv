import { render } from "@testing-library/react";

import { Field } from "../Field";
import { FieldContext } from "../FieldContext";

describe("Field error handling", () => {
  it("throws a helpful error when a sub-component is rendered outside Root", () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Assert
    expect(() => render(<Field.Label>Email</Field.Label>)).toThrow(
      /Field sub-components must be rendered inside a <Field\.Root>/,
    );

    error.mockRestore();
  });

  it("names the context for React DevTools", () => {
    // Assert — an empty displayName would render the provider as anonymous.
    expect(FieldContext.displayName).toBe("FieldContext");
  });
});
