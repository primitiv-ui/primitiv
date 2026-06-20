import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Radio } from "../Radio";

describe("Radio uncontrolled state", () => {
  it("starts checked when defaultChecked is true", () => {
    // Arrange & Act
    render(<Radio.Root defaultChecked aria-label="Compact" />);
    const radio = screen.getByRole("radio", { name: "Compact" });

    // Assert
    expect(radio).toHaveAttribute("aria-checked", "true");
    expect(radio).toHaveAttribute("data-state", "checked");
  });

  it("selects on click from unchecked to checked", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Radio.Root aria-label="Compact" />);
    const radio = screen.getByRole("radio", { name: "Compact" });

    // Act
    await user.click(radio);

    // Assert
    expect(radio).toHaveAttribute("aria-checked", "true");
    expect(radio).toHaveAttribute("data-state", "checked");
  });

  it("is a no-op when an already-selected radio is clicked (no toggle-off)", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Radio.Root
        defaultChecked
        onCheckedChange={onCheckedChange}
        aria-label="Compact"
      />,
    );
    const radio = screen.getByRole("radio", { name: "Compact" });

    // Act
    await user.click(radio);

    // Assert: stays checked and the callback never fires for a re-select.
    expect(radio).toHaveAttribute("aria-checked", "true");
    expect(radio).toHaveAttribute("data-state", "checked");
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("calls onCheckedChange with true the first time it is selected", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Radio.Root onCheckedChange={onCheckedChange} aria-label="Compact" />);
    const radio = screen.getByRole("radio", { name: "Compact" });

    // Act
    await user.click(radio);
    await user.click(radio);

    // Assert: selection is one-way, so the second click is swallowed.
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("composes the consumer's onClick with the internal select (consumer runs first)", async () => {
    // Arrange
    const user = userEvent.setup();
    const order: string[] = [];
    const onClick = vi.fn(() => order.push("consumer"));
    const onCheckedChange = vi.fn(() => order.push("internal"));
    render(
      <Radio.Root
        onClick={onClick}
        onCheckedChange={onCheckedChange}
        aria-label="Compact"
      />,
    );

    // Act
    await user.click(screen.getByRole("radio", { name: "Compact" }));

    // Assert
    expect(order).toEqual(["consumer", "internal"]);
  });
});
