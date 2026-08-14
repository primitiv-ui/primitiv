import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Combobox } from "../Combobox";

describe("Combobox query", () => {
  it("opens the popup and shows the typed text as the user types", async () => {
    const user = userEvent.setup();

    render(
      <Combobox.Root>
        <Combobox.Input aria-label="Framework" />
        <Combobox.Content aria-label="Frameworks" />
      </Combobox.Root>,
    );

    const input = screen.getByRole("combobox", { name: "Framework" });
    expect(screen.queryByRole("listbox", { hidden: true })).not.toBeInTheDocument();

    await user.type(input, "Rea");

    expect(input).toHaveValue("Rea");
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox", { hidden: true })).toBeInTheDocument();
  });

  it("reports the query to onQueryChange on every keystroke", async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();

    render(
      <Combobox.Root onQueryChange={onQueryChange}>
        <Combobox.Input aria-label="Framework" />
        <Combobox.Content aria-label="Frameworks" />
      </Combobox.Root>,
    );

    await user.type(screen.getByRole("combobox", { name: "Framework" }), "Re");

    expect(onQueryChange.mock.calls.map(([q]) => q)).toEqual(["R", "Re"]);
  });

  /*
   * Emptying the field is a deselect.
   *
   * The exploration (§D1) settled that closing resets the text FROM the value, so
   * the field can never sit showing something that is not the value. Taken alone
   * that made a cleared field un-clearable: Escape put the old label straight
   * back. Clearing the value too keeps §D1's invariant intact — empty text, empty
   * value — while letting the gesture mean what the user intended.
   */
  it("clears the committed value when the query is emptied", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Combobox.Root defaultOpen onValueChange={onValueChange}>
        <Combobox.Input aria-label="Framework" />
        <Combobox.Content aria-label="Frameworks">
          <Combobox.Item value="react">React</Combobox.Item>
        </Combobox.Content>
      </Combobox.Root>,
    );

    const input = screen.getByRole("combobox", { name: "Framework" });
    await user.click(screen.getByRole("option", { hidden: true, name: "React" }));
    expect(input).toHaveValue("React");
    onValueChange.mockClear();

    await user.clear(input);

    expect(onValueChange).toHaveBeenCalledWith("");
    expect(screen.getByRole("option", { hidden: true, name: "React" })).toHaveAttribute(
      "aria-selected",
      "false",
    );

    // The point of the change: Escape must not resurrect the label just deleted.
    await user.keyboard("{Escape}");
    expect(input).toHaveValue("");
  });

  it("does not report a value change when an already-empty field is cleared", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Combobox.Root onValueChange={onValueChange}>
        <Combobox.Input aria-label="Framework" />
        <Combobox.Content aria-label="Frameworks">
          <Combobox.Item value="react">React</Combobox.Item>
        </Combobox.Content>
      </Combobox.Root>,
    );

    const input = screen.getByRole("combobox", { name: "Framework" });
    // Typing and deleting back to empty never committed anything, so there is no
    // selection to clear and no reason to tell the consumer otherwise.
    await user.type(input, "Re");
    await user.clear(input);

    expect(onValueChange).not.toHaveBeenCalled();
  });
});
