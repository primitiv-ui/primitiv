import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Combobox } from "../Combobox";

describe("Combobox empty", () => {
  it("renders a no-results message that is not itself an option", () => {
    render(
      <Combobox.Root defaultOpen>
        <Combobox.Input aria-label="Framework" />
        <Combobox.Content aria-label="Frameworks">
          <Combobox.Empty>No frameworks match “xyz”</Combobox.Empty>
        </Combobox.Content>
      </Combobox.Root>,
    );

    expect(screen.getByText("No frameworks match “xyz”")).toBeInTheDocument();
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("is not navigable — the cursor has nothing to land on", async () => {
    const user = userEvent.setup();

    render(
      <Combobox.Root defaultOpen>
        <Combobox.Input aria-label="Framework" />
        <Combobox.Content aria-label="Frameworks">
          <Combobox.Empty>Nothing here</Combobox.Empty>
        </Combobox.Content>
      </Combobox.Root>,
    );

    const input = screen.getByRole("combobox", { name: "Framework" });
    await user.click(input);
    await user.keyboard("{ArrowDown}");

    expect(input).not.toHaveAttribute("aria-activedescendant");
    // and the panel stays open so the user can keep typing
    expect(screen.getByRole("listbox", { name: "Frameworks" })).toBeInTheDocument();
  });
});
