import { render, screen } from "@testing-library/react";

import { Select } from "../Select";

describe("Select basic rendering", () => {
  it("renders an <option> for each Select.Item child so the value is in the DOM", () => {
    // Arrange & Act
    render(
      <Select.Root native>
        <Select.Item value="apple">Apple</Select.Item>
      </Select.Root>,
    );

    // Assert
    expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument();
  });
});
