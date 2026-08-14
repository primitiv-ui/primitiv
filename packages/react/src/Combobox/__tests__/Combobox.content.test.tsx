import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Combobox } from "../Combobox";

describe("Combobox content", () => {
  it("keeps the popup unmounted while closed and reports aria-expanded=false", () => {
    render(
      <Combobox.Root>
        <Combobox.Input aria-label="Framework" />
        <Combobox.Content aria-label="Frameworks" />
      </Combobox.Root>,
    );

    expect(screen.getByRole("combobox", { name: "Framework" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByRole("listbox", { hidden: true })).not.toBeInTheDocument();
  });

  it("renders the popup when open and reports aria-expanded=true", () => {
    render(
      <Combobox.Root defaultOpen>
        <Combobox.Input aria-label="Framework" />
        <Combobox.Content aria-label="Frameworks" />
      </Combobox.Root>,
    );

    expect(screen.getByRole("combobox", { name: "Framework" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("listbox", { hidden: true })).toBeInTheDocument();
  });
});
