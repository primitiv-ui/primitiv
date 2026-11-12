import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";

import { Combobox } from "../Combobox";

function Frameworks({ onQueryChange }: { onQueryChange?: (query: string) => void }) {
  return (
    <Combobox.Root onQueryChange={onQueryChange}>
      <Combobox.Input aria-label="Framework" />
      <Combobox.Content aria-label="Frameworks">
        <Combobox.Item value="react">React</Combobox.Item>
        <Combobox.Item value="preact">Preact</Combobox.Item>
        <Combobox.Item value="vue">Vue</Combobox.Item>
      </Combobox.Content>
    </Combobox.Root>
  );
}

/*
 * The keyboard, typing and choosing run in @primitiv-ui/web's
 * ComboboxController (RFC 0033 D30), hosted on the root. StrictMode mounts,
 * unmounts and remounts once: a controller left connected after the first
 * unmount would handle every event a second time.
 */
describe("Combobox's hosted controller", () => {
  it("handles each keystroke and arrow exactly once under StrictMode", async () => {
    // Arrange
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    render(
      <StrictMode>
        <Frameworks onQueryChange={onQueryChange} />
      </StrictMode>,
    );
    const input = screen.getByRole("combobox", { name: "Framework" });

    // Act
    await user.type(input, "r");
    await user.keyboard("{ArrowDown}{ArrowDown}");

    // Assert
    expect(onQueryChange.mock.calls).toEqual([["r"]]);
    expect(input).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { hidden: true, name: "Preact" }).id,
    );
  });

  it("forwards the root's ref to the element the controller listens on", async () => {
    // Arrange
    const user = userEvent.setup();
    let root: HTMLDivElement | null = null;
    render(
      <Combobox.Root ref={(node) => void (root = node)} data-testid="root">
        <Combobox.Input aria-label="Framework" />
        <Combobox.Content aria-label="Frameworks">
          <Combobox.Item value="react">React</Combobox.Item>
        </Combobox.Content>
      </Combobox.Root>,
    );

    // Act
    await user.type(screen.getByRole("combobox", { name: "Framework" }), "r");

    // Assert
    expect(root).toBe(screen.getByTestId("root"));
    expect(screen.getByRole("combobox", { name: "Framework" })).toHaveAttribute("aria-expanded", "true");
  });

  it("runs a consumer's onChange and onKeyDown beside the controller", async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onKeyDown = vi.fn();
    render(
      <Combobox.Root>
        <Combobox.Input aria-label="Framework" onChange={onChange} onKeyDown={onKeyDown} />
        <Combobox.Content aria-label="Frameworks">
          <Combobox.Item value="react">React</Combobox.Item>
        </Combobox.Content>
      </Combobox.Root>,
    );
    const input = screen.getByRole("combobox", { name: "Framework" });

    // Act
    await user.type(input, "r");

    // Assert
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue("r");
  });
});
