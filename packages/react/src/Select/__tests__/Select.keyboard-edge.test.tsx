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
        <Select.Item value="vue">Vue</Select.Item>
        <Select.Item value="solid">Solid</Select.Item>
      </Select.Content>
    </Select.Root>,
  );
}

describe("Select keyboard edge cases", () => {
  it("focuses the listbox itself and no-ops arrow keys when there are no options", async () => {
    const user = userEvent.setup();
    render(
      <Select.Root>
        <Select.Trigger>
          <Select.Value placeholder="Empty" />
        </Select.Trigger>
        <Select.Content />
      </Select.Root>,
    );

    await user.click(screen.getByRole("button"));
    const list = screen.getByRole("listbox", { hidden: true });
    expect(list).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(list).toHaveFocus();
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });

  it("ignores unhandled multi-character keys", async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole("button"));
    await user.keyboard("{Shift}"); // key.length > 1, not a nav/select key → no-op

    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("option", { name: "React", hidden: true })).toHaveFocus();
  });

  it("Enter is a no-op when focus is on the listbox rather than an option", async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole("button"));
    const list = screen.getByRole("listbox", { hidden: true });
    list.focus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });

  it("typeahead handles a repeated character and a no-option starting point", async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole("button"));
    screen.getByRole("listbox", { hidden: true }).focus();

    await user.keyboard("s"); // from the listbox (no option focused) → Solid
    expect(screen.getByRole("option", { name: "Solid", hidden: true })).toHaveFocus();

    await user.keyboard("s"); // repeated char → cycles, stays on the only "s" option
    expect(screen.getByRole("option", { name: "Solid", hidden: true })).toHaveFocus();
  });
});

describe("Select typeahead reset", () => {
  it("clears the accumulated query after the reset window", async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole("button"));
    await user.keyboard("s"); // → Solid
    expect(screen.getByRole("option", { name: "Solid", hidden: true })).toHaveFocus();

    // Wait past the typeahead reset window, then start a fresh search.
    await new Promise((resolve) => setTimeout(resolve, 600));

    await user.keyboard("v"); // fresh query → Vue
    expect(screen.getByRole("option", { name: "Vue", hidden: true })).toHaveFocus();
  });
});
