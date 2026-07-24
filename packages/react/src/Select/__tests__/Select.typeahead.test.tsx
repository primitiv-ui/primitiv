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
        <Select.Item value="apricot">Apricot</Select.Item>
        <Select.Item value="avocado">Avocado</Select.Item>
        <Select.Item value="banana">Banana</Select.Item>
      </Select.Content>
    </Select.Root>,
  );
}

const option = (name: string) =>
  screen.getByRole("option", { name, hidden: true });

describe("Select typeahead", () => {
  it("jumps to the first option matching a single character", async () => {
    const user = userEvent.setup();
    renderSelect();
    await user.click(screen.getByRole("button")); // opens, focuses Apple

    await user.keyboard("b");
    expect(option("Banana")).toHaveFocus();
  });

  it("skips the current match and cycles on a repeated character, wrapping around", async () => {
    const user = userEvent.setup();
    renderSelect();
    await user.click(screen.getByRole("button")); // Apple focused

    // Typing the focused item's own letter advances to the NEXT match (offset).
    await user.keyboard("a");
    expect(option("Apricot")).toHaveFocus();

    // Repeated same char keeps cycling through the "a" matches…
    await user.keyboard("a");
    expect(option("Avocado")).toHaveFocus();

    // …and wraps back to the first "a" match (past the non-matching Banana).
    await user.keyboard("a");
    expect(option("Apple")).toHaveFocus();
  });

  it("narrows to a prefix match with a multi-character query (no offset skip)", async () => {
    const user = userEvent.setup();
    renderSelect();
    await user.click(screen.getByRole("button")); // Apple focused

    // "av" is not a repeat; it searches from the current index without the
    // single-char skip, so it stays put on the only "av…" match.
    await user.keyboard("av");
    expect(option("Avocado")).toHaveFocus();
  });

  it("does not match when no option starts with the typed text", async () => {
    const user = userEvent.setup();
    renderSelect();
    await user.click(screen.getByRole("button")); // Apple focused

    await user.keyboard("z");
    // Focus stays on Apple — nothing starts with "z".
    expect(option("Apple")).toHaveFocus();
  });

  it("matches a prefix, not a substring", async () => {
    const user = userEvent.setup();
    renderSelect();
    await user.click(screen.getByRole("button")); // Apple focused

    // "n" is a substring of "Banana" but a prefix of nothing, so focus must
    // not jump to Banana (guards startsWith, not includes).
    await user.keyboard("n");
    expect(option("Apple")).toHaveFocus();
  });
});
