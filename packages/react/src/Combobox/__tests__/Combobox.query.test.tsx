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
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.type(input, "Rea");

    expect(input).toHaveValue("Rea");
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox", { name: "Frameworks" })).toBeInTheDocument();
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
});
