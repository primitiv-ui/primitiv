import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Listbox } from "../Listbox";

describe("Listbox group", () => {
  it("names each group for assistive technology", () => {
    render(
      <Listbox.Root type="single" aria-label="Fruits">
        <Listbox.Group label="Citrus">
          <Listbox.Option value="lemon">Lemon</Listbox.Option>
        </Listbox.Group>
        <Listbox.Group label="Berries">
          <Listbox.Option value="fig">Fig</Listbox.Option>
        </Listbox.Group>
      </Listbox.Root>,
    );

    expect(screen.getByRole("group", { name: "Citrus" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Berries" })).toBeInTheDocument();
  });

  it("navigates across group boundaries in DOM order", async () => {
    const user = userEvent.setup();
    render(
      <Listbox.Root type="single" aria-label="Fruits">
        <Listbox.Group label="Citrus">
          <Listbox.Option value="lemon">Lemon</Listbox.Option>
        </Listbox.Group>
        <Listbox.Group label="Berries">
          <Listbox.Option value="fig">Fig</Listbox.Option>
        </Listbox.Group>
      </Listbox.Root>,
    );

    await user.tab();
    await user.keyboard("{ArrowDown}");

    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Fig" }).id,
    );
  });
});
