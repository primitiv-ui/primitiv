import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Listbox } from "../Listbox";

import { fruits, typeaheadOptions } from "./Listbox.fixtures";

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

/**
 * Shift+Arrow "moves focus and selects" the option it lands on. Deliberately
 * does NOT wrap, unlike the plain arrows: extending a range off the end and
 * round to the top selects something the user never travelled past.
 */
describe("Listbox multi-select keyboard — Shift+Arrow", () => {
  it("selects the option it moves onto", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderMultiple({ onValueChange });

    await user.tab();
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}");

    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Banana" }).id,
    );
    selectionIs("Banana");
    expect(onValueChange).toHaveBeenCalledWith(["banana"]);
  });

  it("accumulates a contiguous range", async () => {
    const user = userEvent.setup();
    renderMultiple();

    await user.tab();
    await user.keyboard("{Shift>}{ArrowDown}{ArrowDown}{/Shift}");

    selectionIs("Banana", "Cherry");
  });

  it("extends upwards too", async () => {
    const user = userEvent.setup();
    renderMultiple({ defaultValue: ["cherry"] });

    await user.tab();
    await user.keyboard("{Shift>}{ArrowUp}{/Shift}");

    selectionIs("Banana", "Cherry");
  });

  it("does not re-announce an option that is already selected", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderMultiple({ defaultValue: ["apple", "banana"], onValueChange });

    await user.tab();
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}");

    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Banana" }).id,
    );
    selectionIs("Apple", "Banana");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("stops at the last option instead of wrapping", async () => {
    const user = userEvent.setup();
    renderMultiple({ defaultValue: ["cherry"] });

    await user.tab();
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}");

    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Cherry" }).id,
    );
    selectionIs("Cherry");
  });

  it("skips a disabled option while extending", async () => {
    const user = userEvent.setup();
    render(
      <Listbox.Root type="multiple" aria-label="Fruits">
        <Listbox.Option value="apple">Apple</Listbox.Option>
        <Listbox.Option value="banana" disabled>
          Banana
        </Listbox.Option>
        <Listbox.Option value="cherry">Cherry</Listbox.Option>
      </Listbox.Root>,
    );

    await user.tab();
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}");

    selectionIs("Cherry");
  });

  it("is a plain cursor move in single-selection mode", async () => {
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
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}");

    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Banana" }).id,
    );
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

/**
 * APG: Ctrl+Shift+Home/End selects from the focused option through to the
 * first/last option, and moves the cursor to that edge. Selections outside the
 * swept range survive.
 */
describe("Listbox multi-select keyboard — Ctrl+Shift+Home/End", () => {
  it("sweeps the selection to the end and parks the cursor there", async () => {
    const user = userEvent.setup();
    renderMultiple({ defaultValue: ["banana"] });

    await user.tab();
    await user.keyboard("{Control>}{Shift>}{End}{/Shift}{/Control}");

    selectionIs("Banana", "Cherry");
    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Cherry" }).id,
    );
  });

  it("sweeps the selection to the beginning and parks the cursor there", async () => {
    const user = userEvent.setup();
    renderMultiple({ defaultValue: ["banana"] });

    await user.tab();
    await user.keyboard("{Control>}{Shift>}{Home}{/Shift}{/Control}");

    selectionIs("Apple", "Banana");
    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Apple" }).id,
    );
  });

  it("keeps selections that lie outside the swept range", async () => {
    const user = userEvent.setup();
    render(
      <Listbox.Root type="multiple" defaultValue={["banana"]} aria-label="Fruits">
        {typeaheadOptions.map((fruit) => (
          <Listbox.Option key={fruit.value} value={fruit.value}>
            {fruit.label}
          </Listbox.Option>
        ))}
      </Listbox.Root>,
    );

    await user.tab();
    await user.keyboard("{ArrowUp}{ArrowUp}");
    await user.keyboard("{Control>}{Shift>}{Home}{/Shift}{/Control}");

    selectionIs("Apple", "Apricot", "Banana");
  });

  it("leaves disabled options unselected while sweeping", async () => {
    const user = userEvent.setup();
    render(
      <Listbox.Root type="multiple" defaultValue={["cherry"]} aria-label="Fruits">
        <Listbox.Option value="apple">Apple</Listbox.Option>
        <Listbox.Option value="banana" disabled>
          Banana
        </Listbox.Option>
        <Listbox.Option value="cherry">Cherry</Listbox.Option>
      </Listbox.Root>,
    );

    await user.tab();
    await user.keyboard("{Control>}{Shift>}{Home}{/Shift}{/Control}");

    selectionIs("Apple", "Cherry");
  });

  it("does nothing in single-selection mode", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Listbox.Root
        type="single"
        defaultValue="banana"
        onValueChange={onValueChange}
        aria-label="Fruits"
      >
        {fruits.map((fruit) => (
          <Listbox.Option key={fruit.value} value={fruit.value}>
            {fruit.label}
          </Listbox.Option>
        ))}
      </Listbox.Root>,
    );

    await user.tab();
    await user.keyboard("{Control>}{Shift>}{End}{/Shift}{/Control}");

    selectionIs("Banana");
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

/**
 * Both range operations pivot on the cursor. When options stream in after the
 * listbox took focus there is no cursor to pivot on, so they must decline
 * rather than sweep from a phantom position.
 */
describe("Listbox multi-select keyboard — no cursor to pivot on", () => {
  it.each([
    ["Shift+ArrowDown", "{Shift>}{ArrowDown}{/Shift}"],
    ["Ctrl+Shift+End", "{Control>}{Shift>}{End}{/Shift}{/Control}"],
  ])("%s selects nothing", async (_name, keys) => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <Listbox.Root
        type="multiple"
        onValueChange={onValueChange}
        aria-label="Fruits"
      />,
    );

    await user.tab();
    rerender(
      <Listbox.Root
        type="multiple"
        onValueChange={onValueChange}
        aria-label="Fruits"
      >
        {fruits.map((fruit) => (
          <Listbox.Option key={fruit.value} value={fruit.value}>
            {fruit.label}
          </Listbox.Option>
        ))}
      </Listbox.Root>,
    );

    await user.keyboard(keys);

    selectionIs();
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
