import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Listbox } from "../Listbox";

import { fruits } from "./Listbox.fixtures";

/**
 * APG's rearrangeable example moves options up and down in place. React keeps
 * the same elements mounted across a reorder (stable keys, unchanged props),
 * so nothing re-registers — navigation order has to be read from the DOM, not
 * from the order options happened to mount in.
 */
function Reorderable() {
  const [items, setItems] = useState<(typeof fruits)[number][]>([...fruits]);

  return (
    <>
      <button type="button" onClick={() => setItems([items[2], items[0], items[1]])}>
        Rotate
      </button>
      <Listbox.Root type="single" aria-label="Fruits">
        {items.map((fruit) => (
          <Listbox.Option key={fruit.value} value={fruit.value}>
            {fruit.label}
          </Listbox.Option>
        ))}
      </Listbox.Root>
    </>
  );
}

const cursorIsOn = (name: string) =>
  expect(screen.getByRole("listbox")).toHaveAttribute(
    "aria-activedescendant",
    screen.getByRole("option", { name }).id,
  );

describe("Listbox reordered options", () => {
  it("seeds the cursor onto the option that is now first in the DOM", async () => {
    const user = userEvent.setup();
    render(<Reorderable />);

    await user.click(screen.getByRole("button", { name: "Rotate" }));
    await user.tab();

    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Cherry",
      "Apple",
      "Banana",
    ]);
    cursorIsOn("Cherry");
  });

  it("walks the arrow keys in the new visual order", async () => {
    const user = userEvent.setup();
    render(<Reorderable />);

    await user.click(screen.getByRole("button", { name: "Rotate" }));
    await user.tab();
    await user.keyboard("{ArrowDown}");

    cursorIsOn("Apple");
  });

  it("sends End to the option that is now last", async () => {
    const user = userEvent.setup();
    render(<Reorderable />);

    await user.click(screen.getByRole("button", { name: "Rotate" }));
    await user.tab();
    await user.keyboard("{End}");

    cursorIsOn("Banana");
  });
});
