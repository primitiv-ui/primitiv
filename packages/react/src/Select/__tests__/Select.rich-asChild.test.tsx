import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Select } from "../Select";

describe("Select rich asChild composition", () => {
  it("composes Trigger props onto a custom element and still toggles open", async () => {
    const user = userEvent.setup();
    render(
      <Select.Root>
        <Select.Trigger asChild>
          <a href="#pick" data-testid="custom-trigger">
            <Select.Value placeholder="Pick one" />
          </a>
        </Select.Trigger>
        <Select.Content asChild>
          <section data-testid="custom-content">
            <Select.Item value="apple">Apple</Select.Item>
          </section>
        </Select.Content>
      </Select.Root>,
    );

    const trigger = screen.getByTestId("custom-trigger");
    expect(trigger.tagName).toBe("A");
    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    const content = screen.getByRole("listbox", { hidden: true });
    expect(content).toBe(screen.getByTestId("custom-content"));

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(content).toHaveAttribute("data-popover-open");
  });

  it("delegates Separator to the child element via asChild", () => {
    // Arrange & Act
    render(
      <Select.Root>
        <Select.Trigger>
          <Select.Value placeholder="Pick one" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="apple">Apple</Select.Item>
          <Select.Separator asChild>
            <hr data-testid="custom-sep" />
          </Select.Separator>
          <Select.Item value="banana">Banana</Select.Item>
        </Select.Content>
      </Select.Root>,
    );

    // Assert
    const sep = screen.getByTestId("custom-sep");
    expect(sep.tagName).toBe("HR");
    expect(sep).toHaveAttribute("role", "separator");
  });
});
