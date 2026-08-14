import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Combobox } from "../Combobox";

function renderCombobox(props: Record<string, unknown> = {}) {
  return render(
    <Combobox.Root defaultOpen {...props}>
      <Combobox.Input aria-label="Framework" />
      <Combobox.Content aria-label="Frameworks">
        <Combobox.Item value="react">React</Combobox.Item>
        <Combobox.Item value="preact">Preact</Combobox.Item>
      </Combobox.Content>
    </Combobox.Root>,
  );
}

describe("Combobox item", () => {
  it("renders each item as an option", () => {
    renderCombobox();

    expect(screen.getByRole("option", { hidden: true, name: "React" })).toBeInTheDocument();
    expect(screen.getByRole("option", { hidden: true, name: "Preact" })).toBeInTheDocument();
  });

  it("selects on click: reports the value, closes, and shows the label in the input", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderCombobox({ onValueChange });

    await user.click(screen.getByRole("option", { hidden: true, name: "Preact" }));

    expect(onValueChange).toHaveBeenCalledWith("preact");
    expect(screen.queryByRole("listbox", { hidden: true })).not.toBeInTheDocument();
    // D1: closing resets the input text from the value, not from the query
    expect(screen.getByRole("combobox", { name: "Framework" })).toHaveValue("Preact");
  });

  it("falls back to the value as the label when the item has element children", async () => {
    const user = userEvent.setup();

    render(
      <Combobox.Root defaultOpen>
        <Combobox.Input aria-label="Framework" />
        <Combobox.Content aria-label="Frameworks">
          <Combobox.Item value="react">
            <svg aria-hidden="true" />
            <span>React</span>
          </Combobox.Item>
        </Combobox.Content>
      </Combobox.Root>,
    );

    await user.click(screen.getByRole("option", { hidden: true, name: "React" }));

    expect(screen.getByRole("combobox", { name: "Framework" })).toHaveValue("react");
  });

  it("marks only the selected item aria-selected", async () => {
    const user = userEvent.setup();
    renderCombobox();

    await user.click(screen.getByRole("option", { hidden: true, name: "Preact" }));
    await user.type(screen.getByRole("combobox", { name: "Framework" }), "a");

    expect(screen.getByRole("option", { hidden: true, name: "Preact" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("option", { hidden: true, name: "React" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });
});
