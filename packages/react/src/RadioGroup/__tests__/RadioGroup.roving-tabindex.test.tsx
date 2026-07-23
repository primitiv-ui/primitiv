import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RadioGroup } from "../RadioGroup";

describe("RadioGroup roving tabindex", () => {
  it("puts only the first item in the tab sequence when nothing is selected", () => {
    // Arrange & Act
    render(
      <RadioGroup.Root aria-label="Colour">
        <RadioGroup.Item value="red">Red</RadioGroup.Item>
        <RadioGroup.Item value="green">Green</RadioGroup.Item>
        <RadioGroup.Item value="blue">Blue</RadioGroup.Item>
      </RadioGroup.Root>,
    );

    // Assert
    expect(screen.getByRole("radio", { name: "Red" })).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(screen.getByRole("radio", { name: "Green" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
    expect(screen.getByRole("radio", { name: "Blue" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });

  it("puts only the selected item in the tab sequence when one is selected", () => {
    // Arrange & Act
    render(
      <RadioGroup.Root aria-label="Colour" defaultValue="green">
        <RadioGroup.Item value="red">Red</RadioGroup.Item>
        <RadioGroup.Item value="green">Green</RadioGroup.Item>
        <RadioGroup.Item value="blue">Blue</RadioGroup.Item>
      </RadioGroup.Root>,
    );

    // Assert
    expect(screen.getByRole("radio", { name: "Red" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
    expect(screen.getByRole("radio", { name: "Green" })).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(screen.getByRole("radio", { name: "Blue" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });

  it("moves the tab stop to a newly selected item", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <RadioGroup.Root aria-label="Colour">
        <RadioGroup.Item value="red">Red</RadioGroup.Item>
        <RadioGroup.Item value="green">Green</RadioGroup.Item>
      </RadioGroup.Root>,
    );
    const red = screen.getByRole("radio", { name: "Red" });
    const green = screen.getByRole("radio", { name: "Green" });
    expect(red).toHaveAttribute("tabindex", "0");

    // Act
    await user.click(green);

    // Assert
    expect(red).toHaveAttribute("tabindex", "-1");
    expect(green).toHaveAttribute("tabindex", "0");
  });

  it("unregisters an unmounted item so the home-base tab stop moves", () => {
    // Arrange — nothing selected, so the first item is the home base.
    function Fixture({ items }: { items: string[] }) {
      return (
        <RadioGroup.Root aria-label="Colour">
          {items.map((v) => (
            <RadioGroup.Item key={v} value={v}>
              {v}
            </RadioGroup.Item>
          ))}
        </RadioGroup.Root>
      );
    }
    const { rerender } = render(<Fixture items={["red", "green"]} />);
    expect(screen.getByRole("radio", { name: "red" })).toHaveAttribute(
      "tabindex",
      "0",
    );

    // Act — remove "red"; its effect cleanup must unregister it.
    rerender(<Fixture items={["green"]} />);

    // Assert — with "red" gone from the registry, "green" is the home base. A
    // no-op cleanup would leave "red" registered ahead of it, stranding the tab
    // stop and leaving "green" at tabindex -1.
    expect(screen.getByRole("radio", { name: "green" })).toHaveAttribute(
      "tabindex",
      "0",
    );
  });

  it("tabs into the single home-base item and not the others", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <RadioGroup.Root aria-label="Colour">
          <RadioGroup.Item value="red">Red</RadioGroup.Item>
          <RadioGroup.Item value="green">Green</RadioGroup.Item>
          <RadioGroup.Item value="blue">Blue</RadioGroup.Item>
        </RadioGroup.Root>
        <button type="button">After</button>
      </>,
    );
    screen.getByRole("button", { name: "Before" }).focus();

    // Act
    await user.tab();

    // Assert: focus lands on the first radio (the home base)
    expect(screen.getByRole("radio", { name: "Red" })).toHaveFocus();

    // Tabbing again escapes the group entirely — the other radios are
    // skipped because their tabindex is -1.
    await user.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });
});
