import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Listbox } from "../Listbox";

import { fruits } from "./Listbox.fixtures";

function renderMultiple(props: Record<string, unknown> = {}) {
  return render(
    <Listbox.Root type="multiple" aria-label="Fruits" {...props}>
      {fruits.map((fruit) => (
        <Listbox.Option key={fruit.value} value={fruit.value}>
          {fruit.label}
        </Listbox.Option>
      ))}
    </Listbox.Root>,
  );
}

const selectionIs = (...names: string[]) =>
  expect(
    screen
      .getAllByRole("option")
      .filter((option) => option.getAttribute("aria-selected") === "true")
      .map((option) => option.textContent),
  ).toEqual(names);

/**
 * APG's rearrangeable multi-select example implements the modifier shortcuts
 * the pattern lists as optional. Ctrl+A is the select-all half.
 */
describe("Listbox multi-select keyboard — select all", () => {
  it("selects every option with Ctrl+A", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderMultiple({ onValueChange });

    await user.tab();
    await user.keyboard("{Control>}a{/Control}");

    selectionIs("Apple", "Banana", "Cherry");
    expect(onValueChange).toHaveBeenCalledWith(["apple", "banana", "cherry"]);
  });

  it("deselects every option when Ctrl+A is pressed again", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderMultiple({ onValueChange });

    await user.tab();
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("{Control>}a{/Control}");

    selectionIs();
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });

  it("extends a partial selection to all rather than clearing it", async () => {
    const user = userEvent.setup();
    renderMultiple({ defaultValue: ["banana"] });

    await user.tab();
    await user.keyboard("{Control>}a{/Control}");

    selectionIs("Apple", "Banana", "Cherry");
  });

  it("accepts Cmd+A for macOS", async () => {
    const user = userEvent.setup();
    renderMultiple();

    await user.tab();
    await user.keyboard("{Meta>}a{/Meta}");

    selectionIs("Apple", "Banana", "Cherry");
  });

  it("leaves disabled options out of select-all", async () => {
    const user = userEvent.setup();
    render(
      <Listbox.Root type="multiple" aria-label="Fruits">
        <Listbox.Option value="apple">Apple</Listbox.Option>
        <Listbox.Option value="banana" disabled>
          Banana
        </Listbox.Option>
      </Listbox.Root>,
    );

    await user.tab();
    await user.keyboard("{Control>}a{/Control}");

    selectionIs("Apple");
  });

  it("does nothing in single-selection mode", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Listbox.Root type="single" onValueChange={onValueChange} aria-label="Fruits">
        {fruits.map((fruit) => (
          <Listbox.Option key={fruit.value} value={fruit.value}>
            {fruit.label}
          </Listbox.Option>
        ))}
      </Listbox.Root>,
    );

    await user.tab();
    await user.keyboard("{Control>}a{/Control}");

    selectionIs();
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
