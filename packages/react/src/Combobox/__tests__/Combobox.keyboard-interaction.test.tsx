import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Combobox } from "../Combobox";

function renderCombobox() {
  return render(
    <Combobox.Root defaultOpen>
      <Combobox.Input aria-label="Framework" />
      <Combobox.Content aria-label="Frameworks">
        <Combobox.Item value="react">React</Combobox.Item>
        <Combobox.Item value="preact">Preact</Combobox.Item>
      </Combobox.Content>
    </Combobox.Root>,
  );
}

describe("Combobox keyboard interaction", () => {
  it("closes the popup on Escape while leaving focus in the input", async () => {
    const user = userEvent.setup();
    renderCombobox();

    const input = screen.getByRole("combobox", { name: "Framework" });
    await user.click(input);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it("keeps the committed value when Escape closes the popup", async () => {
    const user = userEvent.setup();
    renderCombobox();

    const input = screen.getByRole("combobox", { name: "Framework" });
    await user.click(screen.getByRole("option", { name: "React" }));
    await user.type(input, "zzz");
    await user.keyboard("{Escape}");

    // Escape abandons the query, so the text returns to the committed value
    expect(input).toHaveValue("React");
  });
});
