import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Listbox } from "../Listbox";

import { typeaheadOptions } from "./Listbox.fixtures";

function renderListbox(props: Record<string, unknown> = {}) {
  return render(
    <Listbox.Root type="single" aria-label="Fruits" {...props}>
      {typeaheadOptions.map((fruit) => (
        <Listbox.Option key={fruit.value} value={fruit.value}>
          {fruit.label}
        </Listbox.Option>
      ))}
    </Listbox.Root>,
  );
}

const cursorIsOn = (name: string) =>
  expect(screen.getByRole("listbox")).toHaveAttribute(
    "aria-activedescendant",
    screen.getByRole("option", { name }).id,
  );

/**
 * Chorded shortcuts belong to the browser and to the consumer — APG's
 * rearrangeable example binds Alt+Arrow to its toolbar. The listbox must not
 * eat them: a bare "a" is typeahead, but Ctrl+A is select-all.
 */
describe("Listbox modifier keys", () => {
  it("leaves Ctrl+A alone rather than treating it as typeahead", async () => {
    const user = userEvent.setup();
    renderListbox();

    await user.tab();
    cursorIsOn("Apple");

    await user.keyboard("{Control>}a{/Control}");

    cursorIsOn("Apple");
  });

  it("leaves Cmd+A alone rather than treating it as typeahead", async () => {
    const user = userEvent.setup();
    renderListbox();

    await user.tab();
    await user.keyboard("{Meta>}a{/Meta}");

    cursorIsOn("Apple");
  });

  it("leaves Alt+Arrow for the consumer's own shortcut", async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    renderListbox({ onKeyDown });

    await user.tab();
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");

    cursorIsOn("Apple");
    expect(onKeyDown).toHaveBeenCalled();
  });

  it("still runs typeahead for an unmodified character", async () => {
    const user = userEvent.setup();
    renderListbox();

    await user.tab();
    await user.keyboard("b");

    cursorIsOn("Banana");
  });

  it("still moves the cursor for an unmodified arrow", async () => {
    const user = userEvent.setup();
    renderListbox();

    await user.tab();
    await user.keyboard("{ArrowDown}");

    cursorIsOn("Apricot");
  });
});
