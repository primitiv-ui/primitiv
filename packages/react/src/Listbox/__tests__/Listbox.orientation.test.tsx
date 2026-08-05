import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Listbox } from "../Listbox";

import { fruits } from "./Listbox.fixtures";

describe("Listbox orientation", () => {
  it("leaves aria-orientation implicit for a vertical listbox", () => {
    render(
      <Listbox.Root type="single" aria-label="Fruits">
        <Listbox.Option value="apple">Apple</Listbox.Option>
      </Listbox.Root>,
    );

    const listbox = screen.getByRole("listbox");
    expect(listbox).not.toHaveAttribute("aria-orientation");
    expect(listbox).toHaveAttribute("data-orientation", "vertical");
  });

  it("declares a horizontal listbox explicitly", () => {
    render(
      <Listbox.Root type="single" orientation="horizontal" aria-label="Fruits">
        <Listbox.Option value="apple">Apple</Listbox.Option>
      </Listbox.Root>,
    );

    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("aria-orientation", "horizontal");
    expect(listbox).toHaveAttribute("data-orientation", "horizontal");
  });

  it("moves the cursor with the horizontal arrow pair", async () => {
    const user = userEvent.setup();
    render(
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
      </Listbox.Root>,
    );

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Banana" }).id,
    );
  });
});
