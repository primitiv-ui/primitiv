import { render, screen } from "@testing-library/react";

import { Select } from "../Select";

describe("Select rich mode (default, native={false})", () => {
  it("does not render a native <select> — it is a context boundary for the rich listbox", () => {
    render(
      <Select.Root>
        <span data-testid="rich-child">rich content</span>
      </Select.Root>,
    );

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByTestId("rich-child")).toBeInTheDocument();
  });
});
