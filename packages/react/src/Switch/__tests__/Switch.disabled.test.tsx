import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Switch } from "../Switch";

describe("Switch disabled", () => {
  it("sets the native disabled attribute on the input", () => {
    // Arrange & Act
    render(<Switch.Root aria-label="Enable notifications" disabled />);

    // Assert
    expect(
      screen.getByRole("switch", { name: "Enable notifications" }),
    ).toBeDisabled();
  });

  it('sets data-disabled="" on the track when disabled', () => {
    // Arrange & Act
    const { container } = render(
      <Switch.Root aria-label="Enable notifications" disabled />,
    );

    // Assert
    expect(container.querySelector("label")).toHaveAttribute("data-disabled", "");
  });

  it("does not set data-disabled when not disabled", () => {
    // Arrange & Act
    const { container } = render(<Switch.Root aria-label="Enable notifications" />);

    // Assert
    expect(container.querySelector("label")).not.toHaveAttribute("data-disabled");
  });

  it("does not toggle or call onCheckedChange when clicked while disabled", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Switch.Root
        aria-label="Enable notifications"
        disabled
        onCheckedChange={onCheckedChange}
      />,
    );
    const sw = screen.getByRole("switch", { name: "Enable notifications" });

    // Act
    await user.click(sw);

    // Assert
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(sw).not.toBeChecked();
  });
});
