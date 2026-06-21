import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Checkbox } from "../Checkbox";

describe("Checkbox uncontrolled state", () => {
  it("starts checked when defaultChecked is true", () => {
    // Arrange & Act
    const { container } = render(
      <Checkbox.Root defaultChecked aria-label="Accept terms" />,
    );

    // Assert
    expect(screen.getByRole("checkbox", { name: "Accept terms" })).toBeChecked();
    expect(container.querySelector("label")).toHaveAttribute(
      "data-state",
      "checked",
    );
  });

  it("toggles on click from unchecked to checked", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Checkbox.Root aria-label="Accept terms" />);
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });

    // Act
    await user.click(checkbox);

    // Assert
    expect(checkbox).toBeChecked();
  });

  it("toggles on click from checked to unchecked", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Checkbox.Root defaultChecked aria-label="Accept terms" />);
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });
    expect(checkbox).toBeChecked();

    // Act
    await user.click(checkbox);

    // Assert
    expect(checkbox).not.toBeChecked();
  });

  it("calls onCheckedChange with the new boolean value", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Checkbox.Root onCheckedChange={onCheckedChange} aria-label="Accept terms" />,
    );
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });

    // Act
    await user.click(checkbox);
    await user.click(checkbox);

    // Assert
    expect(onCheckedChange).toHaveBeenNthCalledWith(1, true);
    expect(onCheckedChange).toHaveBeenNthCalledWith(2, false);
  });

  it("composes a consumer onChange, running it before the internal handler", async () => {
    // Arrange
    const user = userEvent.setup();
    const order: string[] = [];
    const onChange = vi.fn(() => order.push("consumer"));
    const onCheckedChange = vi.fn(() => order.push("internal"));
    render(
      <Checkbox.Root
        onChange={onChange}
        onCheckedChange={onCheckedChange}
        aria-label="Accept terms"
      />,
    );

    // Act
    await user.click(screen.getByRole("checkbox", { name: "Accept terms" }));

    // Assert
    expect(order).toEqual(["consumer", "internal"]);
  });

  it("lets a consumer onChange veto the internal handler via preventDefault", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Checkbox.Root
        onChange={(event) => event.preventDefault()}
        onCheckedChange={onCheckedChange}
        aria-label="Accept terms"
      />,
    );

    // Act
    await user.click(screen.getByRole("checkbox", { name: "Accept terms" }));

    // Assert
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
