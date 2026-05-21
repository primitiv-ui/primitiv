import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { ContextMenu } from "../ContextMenu";

describe("ContextMenu.RadioGroup + ContextMenu.RadioItem", () => {
  it("renders RadioItem as role=menuitemradio with aria-checked", () => {
    // Arrange & Act
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.RadioGroup defaultValue="light">
            <ContextMenu.RadioItem value="light">Light</ContextMenu.RadioItem>
            <ContextMenu.RadioItem value="dark">Dark</ContextMenu.RadioItem>
          </ContextMenu.RadioGroup>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Assert
    expect(
      screen.getByRole("menuitemradio", { name: "Light", hidden: true }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("menuitemradio", { name: "Dark", hidden: true }),
    ).toHaveAttribute("aria-checked", "false");
  });

  it("selects a RadioItem on click and updates the group value (uncontrolled)", () => {
    // Arrange
    const onValueChange = vi.fn();
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.RadioGroup onValueChange={onValueChange}>
            <ContextMenu.RadioItem value="light">Light</ContextMenu.RadioItem>
            <ContextMenu.RadioItem value="dark">Dark</ContextMenu.RadioItem>
          </ContextMenu.RadioGroup>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Act
    fireEvent.click(
      screen.getByRole("menuitemradio", { name: "Dark", hidden: true }),
    );

    // Assert
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("dark");
  });

  it("defers the active value to the consumer in controlled mode", () => {
    // Arrange
    function Controlled() {
      const [value, setValue] = useState("light");
      return (
        <ContextMenu.Root defaultOpen>
          <ContextMenu.Trigger>Area</ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.RadioGroup value={value} onValueChange={setValue}>
              <ContextMenu.RadioItem value="light">Light</ContextMenu.RadioItem>
              <ContextMenu.RadioItem value="dark">Dark</ContextMenu.RadioItem>
            </ContextMenu.RadioGroup>
          </ContextMenu.Content>
        </ContextMenu.Root>
      );
    }
    render(<Controlled />);
    fireEvent.click(
      screen.getByRole("menuitemradio", { name: "Dark", hidden: true }),
    );

    // Assert
    expect(
      screen.getByRole("menuitemradio", { name: "Dark", hidden: true }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("menuitemradio", { name: "Light", hidden: true }),
    ).toHaveAttribute("aria-checked", "false");
  });

  it("throws when RadioItem is rendered outside a RadioGroup", () => {
    // Arrange — suppress the React error boundary noise for the expected throw
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act + Assert
    expect(() =>
      render(
        <ContextMenu.Root defaultOpen>
          <ContextMenu.Trigger>Area</ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.RadioItem value="light">Light</ContextMenu.RadioItem>
          </ContextMenu.Content>
        </ContextMenu.Root>,
      ),
    ).toThrow(/RadioItem must be rendered inside/);

    spy.mockRestore();
  });

  it("no-ops when disabled", () => {
    // Arrange
    const onValueChange = vi.fn();
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.RadioGroup onValueChange={onValueChange}>
            <ContextMenu.RadioItem value="light" disabled>
              Light
            </ContextMenu.RadioItem>
          </ContextMenu.RadioGroup>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Act
    fireEvent.click(
      screen.getByRole("menuitemradio", { name: "Light", hidden: true }),
    );

    // Assert
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
