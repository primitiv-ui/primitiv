import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Radio } from "../Radio";

describe("Radio disabled state", () => {
  it("disables the underlying native input", () => {
    // Arrange & Act
    render(<Radio.Root disabled aria-label="Compact" />);

    // Assert
    expect(screen.getByRole("radio", { name: "Compact" })).toBeDisabled();
  });

  it('sets data-disabled="" on the wrapper so CSS can target the disabled state', () => {
    // Arrange & Act
    const { container } = render(<Radio.Root disabled aria-label="Compact" />);

    // Assert
    expect(container.querySelector("label")).toHaveAttribute(
      "data-disabled",
      "",
    );
  });

  it("omits data-disabled when not disabled", () => {
    // Arrange & Act
    const { container } = render(<Radio.Root aria-label="Compact" />);

    // Assert
    expect(container.querySelector("label")).not.toHaveAttribute("data-disabled");
  });

  it("does not fire onCheckedChange when a disabled radio is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Radio.Root disabled onCheckedChange={onCheckedChange} aria-label="Compact" />,
    );

    // Act
    await user.click(screen.getByRole("radio", { name: "Compact" }));

    // Assert
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
