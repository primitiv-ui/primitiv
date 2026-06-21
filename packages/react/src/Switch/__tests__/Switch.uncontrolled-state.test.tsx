import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Switch } from "../Switch";

describe("Switch uncontrolled state", () => {
  it("starts unchecked when defaultChecked is omitted", () => {
    // Arrange & Act
    render(<Switch.Root aria-label="Enable notifications" />);

    // Assert
    expect(
      screen.getByRole("switch", { name: "Enable notifications" }),
    ).not.toBeChecked();
  });

  it("starts checked when defaultChecked={true}", () => {
    // Arrange & Act
    const { container } = render(
      <Switch.Root aria-label="Enable notifications" defaultChecked />,
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

  it("toggles to checked on first click", async () => {
    // Arrange
    const user = userEvent.setup();
    const { container } = render(<Switch.Root aria-label="Enable notifications" />);
    const sw = screen.getByRole("switch", { name: "Enable notifications" });

    // Act
    await user.click(sw);

    // Assert
    expect(sw).toBeChecked();
    expect(container.querySelector("label")).toHaveAttribute(
      "data-state",
      "checked",
    );
  });

  it("toggles back to unchecked on second click", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Switch.Root aria-label="Enable notifications" defaultChecked />);
    const sw = screen.getByRole("switch", { name: "Enable notifications" });

    // Act
    await user.click(sw);

    // Assert
    expect(sw).not.toBeChecked();
  });

  it("fires onCheckedChange with the new value on each toggle", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Switch.Root aria-label="Enable notifications" onCheckedChange={onCheckedChange} />,
    );

    // Act
    await user.click(screen.getByRole("switch", { name: "Enable notifications" }));

    // Assert
    expect(onCheckedChange).toHaveBeenCalledOnce();
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("composes a consumer onChange, running it before the internal handler", async () => {
    // Arrange
    const user = userEvent.setup();
    const order: string[] = [];
    const onChange = vi.fn(() => order.push("consumer"));
    const onCheckedChange = vi.fn(() => order.push("internal"));
    render(
      <Switch.Root
        aria-label="Enable notifications"
        onChange={onChange}
        onCheckedChange={onCheckedChange}
      />,
    );

    // Act
    await user.click(screen.getByRole("switch", { name: "Enable notifications" }));

    // Assert
    expect(order).toEqual(["consumer", "internal"]);
  });

  it("lets a consumer onChange veto the internal handler via preventDefault", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Switch.Root
        aria-label="Enable notifications"
        onChange={(event) => event.preventDefault()}
        onCheckedChange={onCheckedChange}
      />,
    );

    // Act
    await user.click(screen.getByRole("switch", { name: "Enable notifications" }));

    // Assert
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
