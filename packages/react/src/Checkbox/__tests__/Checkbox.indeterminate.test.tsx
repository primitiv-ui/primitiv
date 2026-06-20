import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Checkbox } from "../Checkbox";

describe("Checkbox indeterminate state", () => {
  it('marks the input partially-checked (aria mixed) when defaultChecked is "indeterminate"', () => {
    // Arrange & Act
    render(<Checkbox.Root defaultChecked="indeterminate" aria-label="Accept terms" />);

    // Assert
    expect(
      screen.getByRole("checkbox", { name: "Accept terms" }),
    ).toBePartiallyChecked();
  });

  it('sets data-state="indeterminate" on the box in indeterminate mode', () => {
    // Arrange & Act
    const { container } = render(
      <Checkbox.Root defaultChecked="indeterminate" aria-label="Accept terms" />,
    );

    // Assert
    expect(container.querySelector("label")).toHaveAttribute(
      "data-state",
      "indeterminate",
    );
  });

  it("resolves to checked=true on the first click (WAI-ARIA tri-state convention)", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    const { container } = render(
      <Checkbox.Root
        defaultChecked="indeterminate"
        onCheckedChange={onCheckedChange}
        aria-label="Accept terms"
      />,
    );
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });

    // Act
    await user.click(checkbox);

    // Assert
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(checkbox).toBeChecked();
    expect(checkbox).not.toBePartiallyChecked();
    expect(container.querySelector("label")).toHaveAttribute(
      "data-state",
      "checked",
    );
  });

  it('honours controlled checked="indeterminate" across re-renders', () => {
    // Arrange
    const { container, rerender } = render(
      <Checkbox.Root checked={false} onCheckedChange={() => {}} aria-label="Accept terms" />,
    );
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });
    expect(checkbox).not.toBeChecked();

    // Act
    rerender(
      <Checkbox.Root checked="indeterminate" onCheckedChange={() => {}} aria-label="Accept terms" />,
    );

    // Assert
    expect(checkbox).toBePartiallyChecked();
    expect(container.querySelector("label")).toHaveAttribute(
      "data-state",
      "indeterminate",
    );
  });
});
