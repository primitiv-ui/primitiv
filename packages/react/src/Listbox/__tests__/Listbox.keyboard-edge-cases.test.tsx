import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

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

  it("ignores arrow keys on a listbox with nothing to navigate", async () => {
    const user = userEvent.setup();
    render(<Listbox.Root type="single" aria-label="Fruits" />);

    await user.tab();
    await user.keyboard("{ArrowDown}{End}");

    expect(screen.getByRole("listbox")).not.toHaveAttribute(
      "aria-activedescendant",
    );
  });

  it("has nothing to select when Enter arrives with no cursor", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <Listbox.Root
        type="single"
        onValueChange={onValueChange}
        aria-label="Fruits"
      />,
    );

    await user.tab();
    rerender(
      <Listbox.Root
        type="single"
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

    await user.keyboard("{Enter}");

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it.each([
    ["{ArrowDown}", "Apple"],
    ["{ArrowUp}", "Cherry"],
  ])(
    "%s enters the list at %s when options arrived after focus",
    async (key, expected) => {
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

      await user.keyboard(key);

      expect(screen.getByRole("listbox")).toHaveAttribute(
        "aria-activedescendant",
        screen.getByRole("option", { name: expected }).id,
      );
    },
  );

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
