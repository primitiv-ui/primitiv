import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Listbox } from "../Listbox";

describe("Listbox basic rendering", () => {
  it("renders a listbox role on the root", () => {
    render(
      <Listbox.Root type="single" aria-label="Fruits">
        <Listbox.Option value="apple">Apple</Listbox.Option>
      </Listbox.Root>,
    );

    expect(screen.getByRole("listbox", { name: "Fruits" })).toBeInTheDocument();
  });
});
