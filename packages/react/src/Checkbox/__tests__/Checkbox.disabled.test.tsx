import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Checkbox } from "../Checkbox";

describe("Checkbox disabled state", () => {
  it("disables the underlying native input", () => {
    // Arrange & Act
    render(<Checkbox.Root disabled aria-label="Accept terms" />);

    // Assert
    expect(screen.getByRole("checkbox", { name: "Accept terms" })).toBeDisabled();
  });

  it('sets data-disabled="" on the box so CSS can target the disabled state', () => {
    // Arrange & Act
    const { container } = render(<Checkbox.Root disabled aria-label="Accept terms" />);

    // Assert
    expect(container.querySelector("label")).toHaveAttribute("data-disabled", "");
  });

  it("omits data-disabled when not disabled", () => {
    // Arrange & Act
    const { container } = render(<Checkbox.Root aria-label="Accept terms" />);

    // Assert
    expect(container.querySelector("label")).not.toHaveAttribute("data-disabled");
  });

  it("does not fire onCheckedChange when a disabled checkbox is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Checkbox.Root disabled onCheckedChange={onCheckedChange} aria-label="Accept terms" />,
    );

    // Act
    await user.click(screen.getByRole("checkbox", { name: "Accept terms" }));

    // Assert
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
