import { render, screen } from "@testing-library/react";

import { Select } from "../Select";

describe("Select basic rendering", () => {
  it("renders an <option> for each Select.Option child so the value is in the DOM", () => {
    // Arrange & Act
    render(
      <Select.Root>
        <Select.Option value="apple">Apple</Select.Option>
      </Select.Root>,
    );

    // Assert
    expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument();
  });
});
