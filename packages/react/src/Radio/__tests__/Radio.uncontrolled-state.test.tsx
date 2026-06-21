import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Radio } from "../Radio";

describe("Radio uncontrolled state", () => {
  it("starts checked when defaultChecked is true", () => {
    // Arrange & Act
    render(<Radio.Root defaultChecked aria-label="Compact" />);

    // Assert
    expect(screen.getByRole("radio", { name: "Compact" })).toBeChecked();
  });

  it("checks on click", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Radio.Root aria-label="Compact" />);
    const radio = screen.getByRole("radio", { name: "Compact" });

    // Act
    await user.click(radio);

    // Assert
    expect(radio).toBeChecked();
  });

  it("calls onCheckedChange with true when it becomes selected", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Radio.Root onCheckedChange={onCheckedChange} aria-label="Compact" />);

    // Act
    await user.click(screen.getByRole("radio", { name: "Compact" }));

    // Assert
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("updates the data-state mirror on the wrapper when selected", async () => {
    // Arrange
    const user = userEvent.setup();
    const { container } = render(<Radio.Root aria-label="Compact" />);

    // Act
    await user.click(screen.getByRole("radio", { name: "Compact" }));

    // Assert
    expect(container.querySelector("label")).toHaveAttribute(
      "data-state",
      "checked",
    );
  });

  it("composes a consumer onChange, running it before the internal handler", async () => {
    // Arrange
    const user = userEvent.setup();
    const order: string[] = [];
    const onChange = vi.fn(() => order.push("consumer"));
    const onCheckedChange = vi.fn(() => order.push("internal"));
    render(
      <Radio.Root
        onChange={onChange}
        onCheckedChange={onCheckedChange}
        aria-label="Compact"
      />,
    );

    // Act
    await user.click(screen.getByRole("radio", { name: "Compact" }));

    // Assert
    expect(order).toEqual(["consumer", "internal"]);
  });

  it("lets a consumer onChange veto the internal handler via preventDefault", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Radio.Root
        onChange={(event) => event.preventDefault()}
        onCheckedChange={onCheckedChange}
        aria-label="Compact"
      />,
    );

    // Act
    await user.click(screen.getByRole("radio", { name: "Compact" }));

    // Assert
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
