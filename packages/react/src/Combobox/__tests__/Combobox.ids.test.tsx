import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Combobox } from "../Combobox";

describe("Combobox ids and ARIA wiring", () => {
  it("points the input's aria-controls at the popup listbox", () => {
    render(
      <Combobox.Root defaultOpen>
        <Combobox.Input aria-label="Framework" />
        <Combobox.Content aria-label="Frameworks" />
      </Combobox.Root>,
    );

    const input = screen.getByRole("combobox", { name: "Framework" });
    const listbox = screen.getByRole("listbox", { name: "Frameworks" });

    expect(listbox.id).not.toBe("");
    expect(input).toHaveAttribute("aria-controls", listbox.id);
  });

  it("declares list autocomplete on the input", () => {
    render(
      <Combobox.Root>
        <Combobox.Input aria-label="Framework" />
        <Combobox.Content aria-label="Frameworks" />
      </Combobox.Root>,
    );

    expect(screen.getByRole("combobox", { name: "Framework" })).toHaveAttribute(
      "aria-autocomplete",
      "list",
    );
  });

  it("scopes ids per instance so two comboboxes never collide", () => {
    render(
      <>
        <Combobox.Root defaultOpen>
          <Combobox.Input aria-label="First" />
          <Combobox.Content aria-label="First list" />
        </Combobox.Root>
        <Combobox.Root defaultOpen>
          <Combobox.Input aria-label="Second" />
          <Combobox.Content aria-label="Second list" />
        </Combobox.Root>
      </>,
    );

    const first = screen.getByRole("listbox", { name: "First list" });
    const second = screen.getByRole("listbox", { name: "Second list" });

    expect(first.id).not.toBe(second.id);
    expect(screen.getByRole("combobox", { name: "First" })).toHaveAttribute(
      "aria-controls",
      first.id,
    );
    expect(screen.getByRole("combobox", { name: "Second" })).toHaveAttribute(
      "aria-controls",
      second.id,
    );
  });
});
