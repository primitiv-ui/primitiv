import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { Radio } from "../Radio";

describe("Radio controlled state", () => {
  it("reflects the controlled `checked` prop", () => {
    // Arrange & Act
    const { rerender } = render(
      <Radio.Root checked={false} onCheckedChange={() => {}} aria-label="Compact" />,
    );
    const radio = screen.getByRole("radio", { name: "Compact" });
    expect(radio).not.toBeChecked();

    rerender(
      <Radio.Root checked onCheckedChange={() => {}} aria-label="Compact" />,
    );

    // Assert
    expect(radio).toBeChecked();
  });

  it("mirrors the controlled value into the wrapper's data-state", () => {
    // Arrange & Act
    const { container } = render(
      <Radio.Root checked onCheckedChange={() => {}} aria-label="Compact" />,
    );

    // Assert
    expect(container.querySelector("label")).toHaveAttribute(
      "data-state",
      "checked",
    );
  });

  it("does not change its rendered state when the parent refuses to update `checked`", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Radio.Root
        checked={false}
        onCheckedChange={onCheckedChange}
        aria-label="Compact"
      />,
    );
    const radio = screen.getByRole("radio", { name: "Compact" });

    // Act
    await user.click(radio);

    // Assert: callback fired but the rendered state stays unchecked.
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(radio).not.toBeChecked();
  });

  it("lets a parent drive the value end to end", async () => {
    // Arrange
    const user = userEvent.setup();
    function Harness() {
      const [checked, setChecked] = useState(false);
      return (
        <Radio.Root
          checked={checked}
          onCheckedChange={setChecked}
          aria-label="Compact"
        />
      );
    }
    render(<Harness />);
    const radio = screen.getByRole("radio", { name: "Compact" });
    expect(radio).not.toBeChecked();

    // Act & Assert
    await user.click(radio);
    expect(radio).toBeChecked();
  });
});
