import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Listbox } from "../Listbox";

import { typeaheadOptions } from "./Listbox.fixtures";

function renderListbox(props: { onValueChange?: (value: string) => void } = {}) {
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

describe("Listbox typeahead", () => {
  it("moves the cursor to the first option matching a single character", async () => {
    const user = userEvent.setup();
    renderListbox();

    await user.tab();
    await user.keyboard("b");

    cursorIsOn("Banana");
  });

  it("cycles through matches on a repeated character, wrapping around", async () => {
    const user = userEvent.setup();
    renderListbox();

    await user.tab();

    await user.keyboard("a");
    cursorIsOn("Apricot");

    await user.keyboard("a");
    cursorIsOn("Avocado");

    await user.keyboard("a");
    cursorIsOn("Apple");
  });

  it("narrows to a prefix match with a multi-character query", async () => {
    const user = userEvent.setup();
    renderListbox();

    await user.tab();
    await user.keyboard("av");

    cursorIsOn("Avocado");
  });

  it("does not select the option it lands on", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderListbox({ onValueChange });

    await user.tab();
    await user.keyboard("b");

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("skips a disabled match", async () => {
    const user = userEvent.setup();
    render(
      <Listbox.Root type="single" aria-label="Fruits">
        <Listbox.Option value="apple">Apple</Listbox.Option>
        <Listbox.Option value="banana" disabled>
          Banana
        </Listbox.Option>
        <Listbox.Option value="blueberry">Blueberry</Listbox.Option>
      </Listbox.Root>,
    );

    await user.tab();
    await user.keyboard("b");

    cursorIsOn("Blueberry");
  });
});
