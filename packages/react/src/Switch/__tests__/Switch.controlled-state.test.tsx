import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Switch } from "../Switch";

describe("Switch controlled state", () => {
  it("reflects checked={true}", () => {
    // Arrange & Act
    const { container } = render(
      <Switch.Root aria-label="Enable notifications" checked onCheckedChange={() => {}} />,
    );

    // Assert
    expect(
      screen.getByRole("switch", { name: "Enable notifications" }),
    ).toBeChecked();
    expect(container.querySelector("label")).toHaveAttribute(
      "data-state",
      "checked",
    );
  });

  it("reflects checked={false}", () => {
    // Arrange & Act
    render(
      <Switch.Root
        aria-label="Enable notifications"
        checked={false}
        onCheckedChange={() => {}}
      />,
    );

    // Assert
    expect(
      screen.getByRole("switch", { name: "Enable notifications" }),
    ).not.toBeChecked();
  });

  it("fires onCheckedChange with the next value when clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Switch.Root
        aria-label="Enable notifications"
        checked={false}
        onCheckedChange={onCheckedChange}
      />,
    );

    // Act
    await user.click(screen.getByRole("switch", { name: "Enable notifications" }));

    // Assert
    expect(onCheckedChange).toHaveBeenCalledOnce();
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("does not change state when the parent ignores onCheckedChange", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Switch.Root
        aria-label="Enable notifications"
        checked={false}
        onCheckedChange={() => {}}
      />,
    );
    const sw = screen.getByRole("switch", { name: "Enable notifications" });

    // Act
    await user.click(sw);

    // Assert — controlled value not updated
    expect(sw).not.toBeChecked();
  });
});
