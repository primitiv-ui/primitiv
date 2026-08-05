import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Listbox } from "../Listbox";

import { fruits } from "./Listbox.fixtures";

describe("Listbox controlled state", () => {
  it("renders the selection the consumer supplies", () => {
    render(
      <Listbox.Root type="single" value="cherry" aria-label="Fruits">
        {fruits.map((fruit) => (
          <Listbox.Option key={fruit.value} value={fruit.value}>
            {fruit.label}
          </Listbox.Option>
        ))}
      </Listbox.Root>,
    );

    expect(screen.getByRole("option", { name: "Cherry" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("does not move the selection on its own", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Listbox.Root
        type="single"
        value="cherry"
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

    await user.click(screen.getByRole("option", { name: "Apple" }));

    expect(onValueChange).toHaveBeenCalledWith("apple");
    expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.getByRole("option", { name: "Cherry" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("seeds the cursor from the controlled selection", async () => {
    const user = userEvent.setup();
    render(
      <Listbox.Root type="single" value="cherry" aria-label="Fruits">
        {fruits.map((fruit) => (
          <Listbox.Option key={fruit.value} value={fruit.value}>
            {fruit.label}
          </Listbox.Option>
        ))}
      </Listbox.Root>,
    );

    await user.tab();

    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Cherry" }).id,
    );
  });

  it("follows the consumer's state through a full round trip", async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [value, setValue] = useState<string[]>([]);
      return (
        <Listbox.Root
          type="multiple"
          value={value}
          onValueChange={setValue}
          aria-label="Fruits"
        >
          {fruits.map((fruit) => (
            <Listbox.Option key={fruit.value} value={fruit.value}>
              {fruit.label}
            </Listbox.Option>
          ))}
        </Listbox.Root>
      );
    }

    render(<Controlled />);

    await user.click(screen.getByRole("option", { name: "Apple" }));
    await user.click(screen.getByRole("option", { name: "Cherry" }));

    expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("option", { name: "Cherry" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
