import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Select } from "../Select";

describe("Select controlled state", () => {
  it("calls onValueChange with the new value string when the user selects a different option", async () => {
    // Arrange
    const onValueChange = vi.fn();
    const user = userEvent.setup();

    function Wrapper() {
      const [value, setValue] = useState("apple");
      const handle = (next: string) => {
        onValueChange(next);
        setValue(next);
      };
      return (
        <Select.Root native value={value} onValueChange={handle}>
          <Select.Item value="apple">Apple</Select.Item>
          <Select.Item value="banana">Banana</Select.Item>
        </Select.Root>
      );
    }

    render(<Wrapper />);

    // Act
    await user.selectOptions(screen.getByRole("combobox"), "banana");

    // Assert
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("banana");
  });

  it("invokes the consumer's own onChange handler alongside onValueChange", async () => {
    // Arrange
    const onChange = vi.fn();
    const onValueChange = vi.fn();
    const user = userEvent.setup();

    function Wrapper() {
      const [value, setValue] = useState("apple");
      return (
        <Select.Root native
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setValue(event.target.value);
          }}
          onValueChange={onValueChange}
        >
          <Select.Item value="apple">Apple</Select.Item>
          <Select.Item value="banana">Banana</Select.Item>
        </Select.Root>
      );
    }

    render(<Wrapper />);

    // Act
    await user.selectOptions(screen.getByRole("combobox"), "banana");

    // Assert
    expect(onChange).toHaveBeenCalledWith("banana");
    expect(onValueChange).toHaveBeenCalledWith("banana");
  });
});
