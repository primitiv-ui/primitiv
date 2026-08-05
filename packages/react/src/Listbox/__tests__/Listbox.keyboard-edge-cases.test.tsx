import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Listbox } from "../Listbox";

import { fruits } from "./Listbox.fixtures";

describe("Listbox keyboard edge cases", () => {
  it("absorbs typeahead on a listbox with nothing to navigate", async () => {
    const user = userEvent.setup();
    render(<Listbox.Root type="single" aria-label="Fruits" />);

    await user.tab();
    await user.keyboard("a");

    expect(screen.getByRole("listbox")).not.toHaveAttribute(
      "aria-activedescendant",
    );
  });

  it("absorbs typeahead when every option is disabled", async () => {
    const user = userEvent.setup();
    render(
      <Listbox.Root type="single" aria-label="Fruits">
        {fruits.map((fruit) => (
          <Listbox.Option key={fruit.value} value={fruit.value} disabled>
            {fruit.label}
          </Listbox.Option>
        ))}
      </Listbox.Root>,
    );

    await user.tab();
    await user.keyboard("b");

    expect(screen.getByRole("listbox")).not.toHaveAttribute(
      "aria-activedescendant",
    );
  });

  // The search-suggestions case: the listbox is focused while still empty and
  // its options stream in afterwards, so the cursor was never seeded. Typeahead
  // has to cope with having no cursor to search from.
  it("matches from the top when options arrive after focus", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Listbox.Root type="single" aria-label="Fruits" />,
    );

    await user.tab();

    rerender(
      <Listbox.Root type="single" aria-label="Fruits">
        {fruits.map((fruit) => (
          <Listbox.Option key={fruit.value} value={fruit.value}>
            {fruit.label}
          </Listbox.Option>
        ))}
      </Listbox.Root>,
    );

    await user.keyboard("b");

    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Banana" }).id,
    );
  });
});
