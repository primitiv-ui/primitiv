import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Switch } from "../Switch";

describe("Switch keyboard interaction", () => {
  it("toggles on Space key", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Switch.Root aria-label="Enable notifications" />);
    const sw = screen.getByRole("switch", { name: "Enable notifications" });
    sw.focus();

    // Act
    await user.keyboard(" ");

    // Assert
    expect(sw).toBeChecked();
  });

  it("does not toggle on Enter (native checkbox semantics)", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Switch.Root aria-label="Enable notifications" />);
    const sw = screen.getByRole("switch", { name: "Enable notifications" });
    sw.focus();

    // Act
    await user.keyboard("{Enter}");

    // Assert
    expect(sw).not.toBeChecked();
  });

  it("does not toggle on Space when disabled", async () => {
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
    sw.focus();

    // Act
    await user.keyboard(" ");

    // Assert
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(sw).not.toBeChecked();
  });
});
