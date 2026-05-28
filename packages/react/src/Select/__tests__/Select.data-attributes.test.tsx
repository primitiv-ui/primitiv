import { render, screen } from "@testing-library/react";

import { Select } from "../Select";

describe("Select data attributes", () => {
  it("renders data-disabled='' on the root <select> when disabled is true so CSS can style the disabled state", () => {
    // Arrange & Act
    render(
      <Select.Root disabled>
        <Select.Option value="apple">Apple</Select.Option>
      </Select.Root>,
    );

    // Assert
    expect(screen.getByRole("combobox")).toHaveAttribute("data-disabled", "");
  });

  it("omits data-disabled entirely when disabled is false or absent so the enabled state has nothing to override", () => {
    // Arrange & Act
    render(
      <Select.Root>
        <Select.Option value="apple">Apple</Select.Option>
      </Select.Root>,
    );

    // Assert
    expect(screen.getByRole("combobox")).not.toHaveAttribute("data-disabled");
  });
});
