import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Listbox } from "../Listbox";

describe("Listbox active descendant", () => {
  it("puts the listbox itself in the tab order and keeps DOM focus on it", async () => {
    const user = userEvent.setup();
    render(
      <Listbox.Root type="single" aria-label="Fruits">
        <Listbox.Option value="apple">Apple</Listbox.Option>
        <Listbox.Option value="banana">Banana</Listbox.Option>
      </Listbox.Root>,
    );

    await user.tab();

    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveFocus();
    expect(screen.getByRole("option", { name: "Apple" })).not.toHaveAttribute(
      "tabindex",
    );
  });

  it("seeds the active option on focus and points aria-activedescendant at it", async () => {
    const user = userEvent.setup();
    render(
      <Listbox.Root type="single" aria-label="Fruits">
        <Listbox.Option value="apple">Apple</Listbox.Option>
        <Listbox.Option value="banana">Banana</Listbox.Option>
      </Listbox.Root>,
    );

    await user.tab();

    const apple = screen.getByRole("option", { name: "Apple" });
    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-activedescendant",
      apple.id,
    );
    expect(apple).toHaveAttribute("data-highlighted", "");
    expect(screen.getByRole("option", { name: "Banana" })).not.toHaveAttribute(
      "data-highlighted",
    );
  });

  it("seeds the active option from the current selection", async () => {
    const user = userEvent.setup();
    render(
      <Listbox.Root type="single" defaultValue="banana" aria-label="Fruits">
        <Listbox.Option value="apple">Apple</Listbox.Option>
        <Listbox.Option value="banana">Banana</Listbox.Option>
      </Listbox.Root>,
    );

    await user.tab();

    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Banana" }).id,
    );
  });

  it("drops the highlight when focus leaves the listbox", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Listbox.Root type="single" aria-label="Fruits">
          <Listbox.Option value="apple">Apple</Listbox.Option>
        </Listbox.Root>
        <button type="button">After</button>
      </>,
    );

    await user.tab();
    await user.tab();

    expect(screen.getByRole("listbox")).not.toHaveAttribute(
      "aria-activedescendant",
    );
    expect(screen.getByRole("option", { name: "Apple" })).not.toHaveAttribute(
      "data-highlighted",
    );
  });
});
