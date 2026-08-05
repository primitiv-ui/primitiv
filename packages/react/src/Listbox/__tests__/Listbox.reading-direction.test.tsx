import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DirectionProvider } from "../../DirectionProvider/index.ts";
import { Listbox } from "../Listbox";

import { fruits } from "./Listbox.fixtures";

describe("Listbox reading direction", () => {
  it("mirrors the horizontal arrow pair under rtl", async () => {
    const user = userEvent.setup();
    render(
      <Listbox.Root
        type="single"
        orientation="horizontal"
        dir="rtl"
        defaultValue="apple"
        aria-label="Fruits"
      >
        {fruits.map((fruit) => (
          <Listbox.Option key={fruit.value} value={fruit.value}>
            {fruit.label}
          </Listbox.Option>
        ))}
      </Listbox.Root>,
    );

    await user.tab();
    await user.keyboard("{ArrowLeft}");

    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Banana" }).id,
    );
  });

  it("inherits the direction from a DirectionProvider", async () => {
    const user = userEvent.setup();
    render(
      <DirectionProvider dir="rtl">
        <Listbox.Root
          type="single"
          orientation="horizontal"
          defaultValue="apple"
          aria-label="Fruits"
        >
          {fruits.map((fruit) => (
            <Listbox.Option key={fruit.value} value={fruit.value}>
              {fruit.label}
            </Listbox.Option>
          ))}
        </Listbox.Root>
      </DirectionProvider>,
    );

    await user.tab();
    await user.keyboard("{ArrowLeft}");

    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Banana" }).id,
    );
  });
});
