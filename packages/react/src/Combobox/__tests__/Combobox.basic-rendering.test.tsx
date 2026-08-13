import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Combobox } from "../Combobox";

describe("Combobox basic rendering", () => {
  it("renders a combobox role on the input", () => {
    render(
      <Combobox.Root>
        <Combobox.Input aria-label="Framework" />
      </Combobox.Root>,
    );

    expect(screen.getByRole("combobox", { name: "Framework" })).toBeInTheDocument();
  });
});
