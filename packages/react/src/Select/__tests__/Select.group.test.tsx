import { render, screen } from "@testing-library/react";

import { Select } from "../Select";

describe("Select group", () => {
  it("renders an <optgroup> with the given label so options can be visually grouped", () => {
    // Arrange & Act
    render(
      <Select.Root native>
        <Select.Group label="Fruits">
          <Select.Item value="apple">Apple</Select.Item>
          <Select.Item value="banana">Banana</Select.Item>
        </Select.Group>
        <Select.Group label="Vegetables">
          <Select.Item value="carrot">Carrot</Select.Item>
        </Select.Group>
      </Select.Root>,
    );

    // Assert — native <optgroup> has implicit role="group" with the
    // label attribute as its accessible name.
    expect(screen.getByRole("group", { name: "Fruits" })).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Vegetables" }),
    ).toBeInTheDocument();
  });

  it("nests its Option children inside the rendered <optgroup>", () => {
    // Arrange & Act
    render(
      <Select.Root native>
        <Select.Group label="Fruits">
          <Select.Item value="apple">Apple</Select.Item>
        </Select.Group>
      </Select.Root>,
    );

    // Assert
    const option = screen.getByRole("option", { name: "Apple" });
    expect(option.parentElement?.tagName).toBe("OPTGROUP");
  });
});
