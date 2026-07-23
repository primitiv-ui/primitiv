import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RadioGroup } from "../RadioGroup";

describe("RadioGroup disabled", () => {
  it("skips disabled items when arrowing forwards", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <RadioGroup.Root aria-label="Colour" defaultValue="red">
        <RadioGroup.Item value="red">Red</RadioGroup.Item>
        <RadioGroup.Item value="green" disabled>
          Green
        </RadioGroup.Item>
        <RadioGroup.Item value="blue">Blue</RadioGroup.Item>
      </RadioGroup.Root>,
    );
    const red = screen.getByRole("radio", { name: "Red" });
    const green = screen.getByRole("radio", { name: "Green" });
    const blue = screen.getByRole("radio", { name: "Blue" });
    red.focus();

    // Act
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(blue).toHaveFocus();
    expect(blue).toHaveAttribute("aria-checked", "true");
    expect(green).toHaveAttribute("aria-checked", "false");
  });

  it("skips disabled items when arrowing backwards", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <RadioGroup.Root aria-label="Colour" defaultValue="blue">
        <RadioGroup.Item value="red">Red</RadioGroup.Item>
        <RadioGroup.Item value="green" disabled>
          Green
        </RadioGroup.Item>
        <RadioGroup.Item value="blue">Blue</RadioGroup.Item>
      </RadioGroup.Root>,
    );
    const red = screen.getByRole("radio", { name: "Red" });
    const blue = screen.getByRole("radio", { name: "Blue" });
    blue.focus();

    // Act
    await user.keyboard("{ArrowUp}");

    // Assert
    expect(red).toHaveFocus();
    expect(red).toHaveAttribute("aria-checked", "true");
  });

  it("re-registers an item's disabled flag when it changes after mount", async () => {
    // Arrange — all enabled at mount; green becomes disabled afterwards.
    const user = userEvent.setup();
    function Fixture({ greenDisabled }: { greenDisabled: boolean }) {
      return (
        <RadioGroup.Root aria-label="Colour" defaultValue="red">
          <RadioGroup.Item value="red">Red</RadioGroup.Item>
          <RadioGroup.Item value="green" disabled={greenDisabled}>
            Green
          </RadioGroup.Item>
          <RadioGroup.Item value="blue">Blue</RadioGroup.Item>
        </RadioGroup.Root>
      );
    }
    const { rerender } = render(<Fixture greenDisabled={false} />);

    // Act — disable green after mount, then arrow forwards from red.
    rerender(<Fixture greenDisabled />);
    screen.getByRole("radio", { name: "Red" }).focus();
    await user.keyboard("{ArrowDown}");

    // Assert — the registrar effect re-ran, so green is skipped and focus lands
    // on blue. A stale registration would keep green navigable and strand focus
    // (a disabled button cannot receive it).
    expect(screen.getByRole("radio", { name: "Blue" })).toHaveFocus();
  });

  it("skips disabled items when computing the home-base tab stop", () => {
    // Arrange & Act
    render(
      <RadioGroup.Root aria-label="Colour">
        <RadioGroup.Item value="red" disabled>
          Red
        </RadioGroup.Item>
        <RadioGroup.Item value="green">Green</RadioGroup.Item>
        <RadioGroup.Item value="blue">Blue</RadioGroup.Item>
      </RadioGroup.Root>,
    );

    // Assert: first enabled item is the tab stop, not the disabled one
    expect(screen.getByRole("radio", { name: "Red" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
    expect(screen.getByRole("radio", { name: "Green" })).toHaveAttribute(
      "tabindex",
      "0",
    );
  });
});
