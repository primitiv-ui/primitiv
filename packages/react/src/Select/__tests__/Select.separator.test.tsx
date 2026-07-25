import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Select } from "../Select";

function renderSelect() {
  return render(
    <Select.Root>
      <Select.Trigger>
        <Select.Value placeholder="Pick one" />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="react">React</Select.Item>
        <Select.Separator />
        <Select.Item value="vue">Vue</Select.Item>
      </Select.Content>
    </Select.Root>,
  );
}

describe("Select.Separator", () => {
  it("renders as a non-focusable <div role=separator>", async () => {
    // Arrange
    const user = userEvent.setup();
    renderSelect();

    // Act
    await user.click(screen.getByRole("button"));

    // Assert
    const separator = screen.getByRole("separator", { hidden: true });
    expect(separator.tagName).toBe("DIV");
  });

  it("is skipped by ArrowDown focus traversal", async () => {
    // Arrange
    const user = userEvent.setup();
    renderSelect();

    // Act — opens, focusing React (the first option)
    await user.click(screen.getByRole("button"));
    await user.keyboard("{ArrowDown}");

    // Assert — arrow skips past the separator onto Vue
    expect(screen.getByRole("option", { name: "Vue", hidden: true })).toHaveFocus();
  });

  it("forwards arbitrary props onto the rendered element", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Select.Root>
        <Select.Trigger>
          <Select.Value placeholder="Pick one" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="react">React</Select.Item>
          <Select.Separator data-testid="sep" className="my-sep" />
          <Select.Item value="vue">Vue</Select.Item>
        </Select.Content>
      </Select.Root>,
    );

    // Act
    await user.click(screen.getByRole("button"));

    // Assert
    const separator = screen.getByTestId("sep");
    expect(separator).toHaveClass("my-sep");
  });
});
