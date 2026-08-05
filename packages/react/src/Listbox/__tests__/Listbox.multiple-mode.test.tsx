import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Listbox } from "../Listbox";

import { fruits } from "./Listbox.fixtures";

function renderMultiple(props: { onValueChange?: (value: string[]) => void }) {
  return render(
    <Listbox.Root
      type="multiple"
      defaultValue={["apple"]}
      aria-label="Fruits"
      {...props}
    >
      {fruits.map((fruit) => (
        <Listbox.Option key={fruit.value} value={fruit.value}>
          {fruit.label}
        </Listbox.Option>
      ))}
    </Listbox.Root>,
  );
}

describe("Listbox multiple mode", () => {
  it("advertises itself as multi-selectable", () => {
    renderMultiple({});

    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-multiselectable",
      "true",
    );
  });

  it("leaves a single-select listbox without aria-multiselectable", () => {
    render(
      <Listbox.Root type="single" aria-label="Fruits">
        <Listbox.Option value="apple">Apple</Listbox.Option>
      </Listbox.Root>,
    );

    expect(screen.getByRole("listbox")).not.toHaveAttribute(
      "aria-multiselectable",
    );
  });

  it("adds to the selection rather than replacing it", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderMultiple({ onValueChange });

    await user.click(screen.getByRole("option", { name: "Cherry" }));

    expect(onValueChange).toHaveBeenCalledWith(["apple", "cherry"]);
    expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("option", { name: "Cherry" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("toggles a selected option back off", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderMultiple({ onValueChange });

    await user.click(screen.getByRole("option", { name: "Apple" }));

    expect(onValueChange).toHaveBeenCalledWith([]);
    expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("toggles the cursor option with Space", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderMultiple({ onValueChange });

    await user.tab();
    await user.keyboard("{ArrowDown}");
    await user.keyboard(" ");

    expect(onValueChange).toHaveBeenCalledWith(["apple", "banana"]);
  });
});
