import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { Checkbox } from "../Checkbox";

describe("Checkbox controlled state", () => {
  it("reflects the controlled `checked` prop", () => {
    // Arrange & Act
    const { container, rerender } = render(
      <Checkbox.Root checked={false} onCheckedChange={() => {}} aria-label="Accept terms" />,
    );
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });
    expect(checkbox).not.toBeChecked();

    rerender(
      <Checkbox.Root checked onCheckedChange={() => {}} aria-label="Accept terms" />,
    );

    // Assert
    expect(checkbox).toBeChecked();
    expect(container.querySelector("label")).toHaveAttribute(
      "data-state",
      "checked",
    );
  });

  it("does not update its rendered state when the parent refuses to update `checked`", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Checkbox.Root
        checked={false}
        onCheckedChange={onCheckedChange}
        aria-label="Accept terms"
      />,
    );
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });

    // Act
    await user.click(checkbox);

    // Assert: callback fired but the rendered state stays unchecked.
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(checkbox).not.toBeChecked();
  });

  it("lets a parent drive the value end to end", async () => {
    // Arrange
    const user = userEvent.setup();
    function Harness() {
      // Start true so the pre-click state is only correct if the controlled
      // prop is honoured (a broken impl would fall back to unchecked).
      const [checked, setChecked] = useState(true);
      return (
        <Checkbox.Root
          checked={checked}
          onCheckedChange={setChecked}
          aria-label="Accept terms"
        />
      );
    }
    render(<Harness />);
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });
    expect(checkbox).toBeChecked();

    // Act & Assert
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
