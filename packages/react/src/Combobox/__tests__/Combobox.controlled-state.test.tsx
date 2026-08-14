import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Combobox } from "../Combobox";

describe("Combobox controlled state", () => {
  it("does not open on its own when `open` is controlled", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <Combobox.Root open={false} onOpenChange={onOpenChange}>
        <Combobox.Input aria-label="Framework" />
        <Combobox.Content aria-label="Frameworks">
          <Combobox.Item value="react">React</Combobox.Item>
        </Combobox.Content>
      </Combobox.Root>,
    );

    await user.type(screen.getByRole("combobox", { name: "Framework" }), "R");

    // the parent owns it: we ask, we do not assume
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("listbox", { hidden: true })).not.toBeInTheDocument();
  });

  it("honours a controlled `open` set by the parent", () => {
    render(
      <Combobox.Root open>
        <Combobox.Input aria-label="Framework" />
        <Combobox.Content aria-label="Frameworks">
          <Combobox.Item value="react">React</Combobox.Item>
        </Combobox.Content>
      </Combobox.Root>,
    );

    expect(screen.getByRole("listbox", { hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Framework" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("marks the controlled value as selected without any interaction", () => {
    render(
      <Combobox.Root open value="preact">
        <Combobox.Input aria-label="Framework" />
        <Combobox.Content aria-label="Frameworks">
          <Combobox.Item value="react">React</Combobox.Item>
          <Combobox.Item value="preact">Preact</Combobox.Item>
        </Combobox.Content>
      </Combobox.Root>,
    );

    expect(screen.getByRole("option", { hidden: true, name: "Preact" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("option", { hidden: true, name: "React" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("does not change the selected value on its own when `value` is controlled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Combobox.Root open value="react" onValueChange={onValueChange}>
        <Combobox.Input aria-label="Framework" />
        <Combobox.Content aria-label="Frameworks">
          <Combobox.Item value="react">React</Combobox.Item>
          <Combobox.Item value="preact">Preact</Combobox.Item>
        </Combobox.Content>
      </Combobox.Root>,
    );

    await user.click(screen.getByRole("option", { hidden: true, name: "Preact" }));

    expect(onValueChange).toHaveBeenCalledWith("preact");
    expect(screen.getByRole("option", { hidden: true, name: "React" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
