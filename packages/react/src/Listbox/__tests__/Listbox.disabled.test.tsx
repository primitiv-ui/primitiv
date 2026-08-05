import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Listbox } from "../Listbox";

describe("Listbox disabled options", () => {
  it("marks a disabled option in the accessibility tree and for CSS", () => {
    render(
      <Listbox.Root type="single" aria-label="Fruits">
        <Listbox.Option value="apple">Apple</Listbox.Option>
        <Listbox.Option value="banana" disabled>
          Banana
        </Listbox.Option>
      </Listbox.Root>,
    );

    const banana = screen.getByRole("option", { name: "Banana" });
    expect(banana).toHaveAttribute("aria-disabled", "true");
    expect(banana).toHaveAttribute("data-disabled", "");
    expect(screen.getByRole("option", { name: "Apple" })).not.toHaveAttribute(
      "data-disabled",
    );
  });

  it("skips a disabled option when moving the cursor", async () => {
    const user = userEvent.setup();
    render(
      <Listbox.Root type="single" defaultValue="apple" aria-label="Fruits">
        <Listbox.Option value="apple">Apple</Listbox.Option>
        <Listbox.Option value="banana" disabled>
          Banana
        </Listbox.Option>
        <Listbox.Option value="cherry">Cherry</Listbox.Option>
      </Listbox.Root>,
    );

    await user.tab();
    await user.keyboard("{ArrowDown}");

    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Cherry" }).id,
    );
  });

  it("does not select a disabled option on click", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Listbox.Root
        type="single"
        onValueChange={onValueChange}
        aria-label="Fruits"
      >
        <Listbox.Option value="apple">Apple</Listbox.Option>
        <Listbox.Option value="banana" disabled>
          Banana
        </Listbox.Option>
      </Listbox.Root>,
    );

    await user.click(screen.getByRole("option", { name: "Banana" }));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("option", { name: "Banana" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("seeds the cursor past a leading disabled option", async () => {
    const user = userEvent.setup();
    render(
      <Listbox.Root type="single" aria-label="Fruits">
        <Listbox.Option value="apple" disabled>
          Apple
        </Listbox.Option>
        <Listbox.Option value="banana">Banana</Listbox.Option>
      </Listbox.Root>,
    );

    await user.tab();

    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Banana" }).id,
    );
  });
});
