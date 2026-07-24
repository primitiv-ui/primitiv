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
        <Select.Item value="apple">Apple</Select.Item>
      </Select.Content>
    </Select.Root>,
  );
}

describe("Select rich open/close", () => {
  it("Trigger exposes the listbox ARIA contract and starts collapsed", () => {
    renderSelect();

    const trigger = screen.getByRole("button");
    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-controls");
    // Popover polyfill mirrors open state to `data-popover-open`.
    expect(screen.getByRole("listbox", { hidden: true })).not.toHaveAttribute("data-popover-open");
  });

  it("opens the listbox when the Trigger is clicked", async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole("button"));

    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox", { hidden: true })).toHaveAttribute("data-popover-open");

    // A non-Escape key inside the open listbox is a no-op (typeahead / arrow
    // navigation arrive in a later cycle) — the listbox stays open.
    await user.keyboard("a");
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });

  it("closes on Escape and returns focus to the Trigger", async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole("button"));
    await user.keyboard("{Escape}");

    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("listbox", { hidden: true })).not.toHaveAttribute("data-popover-open");
    expect(screen.getByRole("button")).toHaveFocus();
  });
});
