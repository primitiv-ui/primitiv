import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { Select } from "../Select";
import type { SelectRootProps } from "../types";

function renderSelect(root: SelectRootProps = {}) {
  return render(
    <Select.Root {...root}>
      <Select.Trigger>
        <Select.Value placeholder="Pick one" />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="react">React</Select.Item>
        <Select.Item value="vue">Vue</Select.Item>
        <Select.Item value="svelte" disabled>
          Svelte
        </Select.Item>
      </Select.Content>
    </Select.Root>,
  );
}

describe("Select rich selection", () => {
  it("renders each Item as role=option, none selected initially", async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole("button"));

    const options = screen.getAllByRole("option", { hidden: true });
    expect(options).toHaveLength(3);
    options.forEach((o) => expect(o).toHaveAttribute("aria-selected", "false"));
    expect(screen.getByText("Svelte")).toHaveAttribute("aria-disabled", "true");
  });

  it("selecting an item fires onValueChange and closes, returning focus to the trigger", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderSelect({ onValueChange });

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Vue"));

    expect(onValueChange).toHaveBeenCalledWith("vue");
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button")).toHaveFocus();
  });

  it("reflects the controlled value as aria-selected on the matching item", async () => {
    const user = userEvent.setup();
    renderSelect({ value: "vue", onValueChange: vi.fn() });

    await user.click(screen.getByRole("button"));

    expect(screen.getByText("Vue")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("React")).toHaveAttribute("aria-selected", "false");
  });

  it("does not select a disabled item and keeps the listbox open", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderSelect({ onValueChange });

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Svelte"));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });
});
