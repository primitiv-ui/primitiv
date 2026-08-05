import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Listbox } from "../Listbox";

import { cursorKeyCases, fruits } from "./Listbox.fixtures";

describe("Listbox keyboard interaction", () => {
  describe.each(cursorKeyCases)(
    "$key with the cursor on $from",
    ({ key, from, expected }) => {
      it(`moves the cursor to ${expected}`, async () => {
        const user = userEvent.setup();
        render(
          <Listbox.Root type="single" defaultValue={from} aria-label="Fruits">
            {fruits.map((fruit) => (
              <Listbox.Option key={fruit.value} value={fruit.value}>
                {fruit.label}
              </Listbox.Option>
            ))}
          </Listbox.Root>,
        );

        await user.tab();
        await user.keyboard(key);

        expect(screen.getByRole("listbox")).toHaveAttribute(
          "aria-activedescendant",
          screen.getByRole("option", { name: expected }).id,
        );
      });
    },
  );

  it("does not change the selection while the cursor moves", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Listbox.Root
        type="single"
        defaultValue="apple"
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
    await user.keyboard("{ArrowDown}");

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it.each(["{Enter}", " "])("selects the cursor option with %s", async (key) => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
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

    await user.tab();
    await user.keyboard("{ArrowDown}");
    await user.keyboard(key);

    expect(onValueChange).toHaveBeenCalledWith("banana");
    expect(screen.getByRole("option", { name: "Banana" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("scrolls the newly active option into view", async () => {
    const user = userEvent.setup();
    render(
      <Listbox.Root type="single" defaultValue="apple" aria-label="Fruits">
        {fruits.map((fruit) => (
          <Listbox.Option key={fruit.value} value={fruit.value}>
            {fruit.label}
          </Listbox.Option>
        ))}
      </Listbox.Root>,
    );

    const banana = screen.getByRole("option", { name: "Banana" });
    const scrollIntoView = vi.spyOn(banana, "scrollIntoView");

    await user.tab();
    await user.keyboard("{ArrowDown}");

    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
  });
});
