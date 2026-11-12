import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode, createRef } from "react";

import { Listbox } from "../Listbox";

// Listbox's DOM behaviour runs in the shared ListboxController from
// @primitiv-ui/web (RFC 0033 §3.4). These cover what hosting it adds: one
// controller per root under StrictMode, the root's ref still reaching the
// consumer, and the consumer's own focus and key handlers running beside the
// controller's.

describe("Listbox on the shared controller", () => {
  it("selects once per click under StrictMode, whose effects run twice", async () => {
    // Arrange
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StrictMode>
        <Listbox.Root type="multiple" value={[]} onValueChange={onValueChange} aria-label="Fruit">
          <Listbox.Option value="apple">Apple</Listbox.Option>
          <Listbox.Option value="banana">Banana</Listbox.Option>
        </Listbox.Root>
      </StrictMode>,
    );

    // Act
    await user.click(screen.getByRole("option", { name: "Banana" }));

    // Assert
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(["banana"]);
  });

  it("keeps working when the root is given a ref, which still reaches the consumer", async () => {
    // Arrange
    const user = userEvent.setup();
    const ref = createRef<HTMLDivElement>();
    render(
      <Listbox.Root ref={ref} type="single" aria-label="Fruit">
        <Listbox.Option value="apple">Apple</Listbox.Option>
        <Listbox.Option value="banana">Banana</Listbox.Option>
      </Listbox.Root>,
    );

    // Act
    await user.tab();
    await user.keyboard("{ArrowDown}{Enter}");

    // Assert
    expect(ref.current).toBe(screen.getByRole("listbox"));
    expect(screen.getByRole("option", { name: "Banana" }).getAttribute("aria-selected")).toBe("true");
  });

  it("runs the consumer's focus, blur and key handlers beside the cursor", async () => {
    // Arrange
    const user = userEvent.setup();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const onKeyDown = vi.fn();
    render(
      <>
        <Listbox.Root type="single" aria-label="Fruit" onFocus={onFocus} onBlur={onBlur} onKeyDown={onKeyDown}>
          <Listbox.Option value="apple">Apple</Listbox.Option>
          <Listbox.Option value="banana">Banana</Listbox.Option>
        </Listbox.Root>
        <button type="button">After</button>
      </>,
    );

    // Act
    await user.tab();
    await user.keyboard("{ArrowDown}");
    const cursor = screen.getByRole("listbox").getAttribute("aria-activedescendant");
    await user.tab();

    // Assert
    expect(cursor).toBe(screen.getByRole("option", { name: "Banana" }).id);
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onKeyDown.mock.calls.map(([event]) => event.key)).toEqual(["ArrowDown", "Tab"]);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
