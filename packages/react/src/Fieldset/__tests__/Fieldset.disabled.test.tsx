import { render, screen } from "@testing-library/react";

import { Fieldset } from "../Fieldset";

describe("Fieldset disabled state", () => {
  it("sets the native disabled attribute on the fieldset", () => {
    // Arrange & Act
    render(<Fieldset.Root disabled />);

    // Assert
    expect(screen.getByRole("group")).toBeDisabled();
  });

  it('sets data-disabled="" as a CSS styling hook', () => {
    // Arrange & Act
    render(<Fieldset.Root disabled data-testid="fs" />);

    // Assert
    expect(screen.getByTestId("fs")).toHaveAttribute("data-disabled", "");
  });

  it("does not set data-disabled when not disabled", () => {
    // Arrange & Act
    render(<Fieldset.Root data-testid="fs" />);

    // Assert
    expect(screen.getByTestId("fs")).not.toHaveAttribute("data-disabled");
  });

  it("disables form controls nested inside the fieldset", () => {
    // Arrange & Act
    render(
      <Fieldset.Root disabled>
        <input data-testid="field" />
      </Fieldset.Root>,
    );

    // Assert
    expect(screen.getByTestId("field")).toBeDisabled();
  });
});
