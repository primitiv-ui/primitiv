import { render, screen } from "@testing-library/react";

import { Select } from "../Select";

describe("Select.Item in native mode", () => {
  it("renders a native <option> for each item so its value is in the DOM", () => {
    render(
      <Select.Root native>
        <Select.Item value="apple">Apple</Select.Item>
      </Select.Root>,
    );

    expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument();
  });

  it("keeps only string/number children as the option text, dropping element children", () => {
    render(
      <Select.Root native defaultValue="apple">
        <Select.Item value="apple">
          <svg data-testid="leading-icon" />
          Apple
        </Select.Item>
      </Select.Root>,
    );

    const option = screen.getByRole("option", { name: "Apple" });
    expect(option).toHaveTextContent("Apple");
    expect(screen.queryByTestId("leading-icon")).not.toBeInTheDocument();
  });
});
