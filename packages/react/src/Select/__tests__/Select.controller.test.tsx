import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode, useState } from "react";

import { Select } from "../Select";

// Rich Select's list behaviour runs in the shared SelectController from
// @primitiv-ui/web (RFC 0033 §3.4). These cover what hosting it adds: one
// controller per list under StrictMode, and a consumer's own handlers running
// beside the controller's.

function Fruit({ onValueChange, onKeyDown, onClick }: { onValueChange?: (v: string) => void; onKeyDown?: () => void; onClick?: () => void }) {
  return (
    <Select.Root defaultValue="apple" onValueChange={onValueChange}>
      <Select.Trigger aria-label="Fruit">
        <Select.Value placeholder="Pick a fruit" />
      </Select.Trigger>
      <Select.Content onKeyDown={onKeyDown}>
        <Select.Item value="apple">Apple</Select.Item>
        <Select.Item value="cherry" onClick={onClick}>
          Cherry
        </Select.Item>
      </Select.Content>
    </Select.Root>
  );
}

describe("Select on the shared controller", () => {
  it("chooses once per click under StrictMode, whose effects run twice", async () => {
    // Arrange
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StrictMode>
        <Fruit onValueChange={onValueChange} />
      </StrictMode>,
    );
    await user.click(screen.getByRole("button", { name: "Fruit" }));

    // Act
    await user.click(screen.getByRole("option", { name: "Cherry", hidden: true }));

    // Assert
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("cherry");
  });

  it("runs the consumer's key and click handlers beside the controller's", async () => {
    // Arrange
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    const onClick = vi.fn();
    render(<Fruit onKeyDown={onKeyDown} onClick={onClick} />);
    await user.click(screen.getByRole("button", { name: "Fruit" }));

    // Act
    await user.keyboard("{ArrowDown}");
    const focused = document.activeElement;
    await user.click(screen.getByRole("option", { name: "Cherry", hidden: true }));

    // Assert
    expect(focused).toBe(screen.getByRole("option", { name: "Cherry", hidden: true }));
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Fruit" }).textContent).toBe("Cherry");
  });

  it("chooses an item added after the list mounted", async () => {
    // Arrange
    const user = userEvent.setup();
    const { rerender } = render(<Grow items={["apple"]} />);
    rerender(<Grow items={["apple", "date"]} />);
    await user.click(screen.getByRole("button", { name: "Fruit" }));

    // Act
    await user.click(screen.getByRole("option", { name: "date", hidden: true }));

    // Assert
    expect(screen.getByRole("button", { name: "Fruit" }).textContent).toBe("date");
  });

  it("chooses an item by its current value after the value changes", async () => {
    // Arrange
    const user = userEvent.setup();
    const { rerender } = render(<Grow items={["apple"]} />);
    rerender(<Grow items={["apricot"]} />);
    await user.click(screen.getByRole("button", { name: "Fruit" }));

    // Act
    await user.click(screen.getByRole("option", { name: "apricot", hidden: true }));

    // Assert
    expect(screen.getByRole("button", { name: "Fruit" }).textContent).toBe("apricot");
  });
});

/** A select whose items are `items`, each keyed by position so a value change keeps its element. */
function Grow({ items }: { items: readonly string[] }) {
  return (
    <Select.Root>
      <Select.Trigger aria-label="Fruit">
        <Select.Value placeholder="Pick a fruit" />
      </Select.Trigger>
      <Select.Content>
        {items.map((item, index) => (
          <Select.Item key={index} value={item}>
            {item}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}

describe("Select state the controller relies on", () => {
  it("reports Escape closing a list its parent opened through a controlled open", async () => {
    // Arrange
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open from outside
          </button>
          <Select.Root
            open={open}
            onOpenChange={(next) => {
              onOpenChange(next);
              setOpen(next);
            }}
          >
            <Select.Trigger aria-label="Fruit">
              <Select.Value placeholder="Pick a fruit" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="apple">Apple</Select.Item>
            </Select.Content>
          </Select.Root>
        </>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "Open from outside" }));

    // Act
    await user.keyboard("{Escape}");

    // Assert
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("leaves a native select on its first option when an item, not a placeholder, has the empty value", () => {
    // Arrange & Act
    render(
      <Select.Root native aria-label="Fruit">
        <Select.Item value="apple">Apple</Select.Item>
        <Select.Item value="">None</Select.Item>
      </Select.Root>,
    );

    // Assert
    expect((screen.getByRole("combobox", { name: "Fruit" }) as HTMLSelectElement).value).toBe("apple");
  });
});
