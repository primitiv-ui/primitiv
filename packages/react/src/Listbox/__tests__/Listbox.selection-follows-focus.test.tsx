import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Listbox } from "../Listbox";

import { fruits } from "./Listbox.fixtures";

describe("Listbox selectionFollowsFocus", () => {
  it("selects each option the cursor lands on", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Listbox.Root
        type="single"
        defaultValue="apple"
        selectionFollowsFocus
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

    expect(onValueChange).toHaveBeenCalledWith("banana");
    expect(screen.getByRole("option", { name: "Banana" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("still moves the cursor with the selection", async () => {
    const user = userEvent.setup();
    render(
      <Listbox.Root
        type="single"
        defaultValue="apple"
        selectionFollowsFocus
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
    await user.keyboard("{End}");

    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Cherry" }).id,
    );
  });
});
