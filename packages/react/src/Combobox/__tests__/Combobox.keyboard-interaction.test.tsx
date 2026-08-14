import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

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

/*
 * Cursor scrolling. The registry panel caps at 18rem and scrolls past it, so a
 * cursor that moves without bringing itself into view walks straight off the
 * bottom of a filtered list — APG requires the referenced option to be made
 * visible. `block: "nearest"` specifically: it is the option that does nothing
 * when the item is already on screen, so ordinary arrowing does not jerk the list
 * about. Same contract, and the same spy technique, as Listbox.
 */
describe("Combobox cursor scrolling", () => {
  it("scrolls the seeded item into view when ArrowDown opens the cursor", async () => {
    const user = userEvent.setup();
    renderCombobox();

    const react = screen.getByRole("option", { hidden: true, name: "React" });
    const scrollIntoView = vi.spyOn(react, "scrollIntoView");

    await user.click(screen.getByRole("combobox", { name: "Framework" }));
    await user.keyboard("{ArrowDown}");

    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
  });

  it("scrolls each item into view as the cursor moves onto it", async () => {
    const user = userEvent.setup();
    renderCombobox();

    const preact = screen.getByRole("option", { hidden: true, name: "Preact" });
    const scrollIntoView = vi.spyOn(preact, "scrollIntoView");

    await user.click(screen.getByRole("combobox", { name: "Framework" }));
    await user.keyboard("{ArrowDown}{ArrowDown}");

    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
  });

  it("scrolls the last item into view on End", async () => {
    const user = userEvent.setup();
    renderCombobox();

    const preact = screen.getByRole("option", { hidden: true, name: "Preact" });
    const scrollIntoView = vi.spyOn(preact, "scrollIntoView");

    await user.click(screen.getByRole("combobox", { name: "Framework" }));
    // Seed the cursor first: Home/End move an existing cursor rather than
    // creating one.
    await user.keyboard("{ArrowDown}{End}");

    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
  });

  it("scrolls the seeded item into view when ArrowUp opens the cursor at the end", async () => {
    const user = userEvent.setup();
    renderCombobox();

    const preact = screen.getByRole("option", { hidden: true, name: "Preact" });
    const scrollIntoView = vi.spyOn(preact, "scrollIntoView");

    await user.click(screen.getByRole("combobox", { name: "Framework" }));
    await user.keyboard("{ArrowUp}");

    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
  });
});

describe("Combobox keyboard interaction", () => {
  it("closes the popup on Escape while leaving focus in the input", async () => {
    const user = userEvent.setup();
    renderCombobox();

    const input = screen.getByRole("combobox", { name: "Framework" });
    await user.click(input);
    expect(screen.getByRole("listbox", { hidden: true })).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox", { hidden: true })).not.toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it("moves the cursor with the arrow keys and publishes it as aria-activedescendant", async () => {
    const user = userEvent.setup();
    renderCombobox();

    const input = screen.getByRole("combobox", { name: "Framework" });
    await user.click(input);

    // no cursor until the user asks for one
    expect(input).not.toHaveAttribute("aria-activedescendant");

    await user.keyboard("{ArrowDown}");
    const react = screen.getByRole("option", { hidden: true, name: "React" });
    expect(input).toHaveAttribute("aria-activedescendant", react.id);
    expect(react).toHaveAttribute("data-highlighted", "");

    await user.keyboard("{ArrowDown}");
    const preact = screen.getByRole("option", { hidden: true, name: "Preact" });
    expect(input).toHaveAttribute("aria-activedescendant", preact.id);
    expect(react).not.toHaveAttribute("data-highlighted");

    await user.keyboard("{ArrowUp}");
    expect(input).toHaveAttribute("aria-activedescendant", react.id);

    // virtual focus: the cursor moves without an option ever taking DOM focus
    expect(input).toHaveFocus();
    expect(react).not.toHaveFocus();
  });

  it("seeds the cursor on the last item when ArrowUp opens the cursor", async () => {
    const user = userEvent.setup();
    renderCombobox();

    const input = screen.getByRole("combobox", { name: "Framework" });
    await user.click(input);
    await user.keyboard("{ArrowUp}");

    expect(input).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { hidden: true, name: "Preact" }).id,
    );
  });

  it("commits the cursor item on Enter", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Combobox.Root defaultOpen onValueChange={onValueChange}>
        <Combobox.Input aria-label="Framework" />
        <Combobox.Content aria-label="Frameworks">
          <Combobox.Item value="react">React</Combobox.Item>
          <Combobox.Item value="preact">Preact</Combobox.Item>
        </Combobox.Content>
      </Combobox.Root>,
    );

    const input = screen.getByRole("combobox", { name: "Framework" });
    await user.click(input);
    await user.keyboard("{ArrowDown}{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(onValueChange).toHaveBeenCalledWith("preact");
    expect(screen.queryByRole("listbox", { hidden: true })).not.toBeInTheDocument();
    expect(input).toHaveValue("Preact");
  });

  it("ignores Enter while there is no cursor", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Combobox.Root defaultOpen onValueChange={onValueChange}>
        <Combobox.Input aria-label="Framework" />
        <Combobox.Content aria-label="Frameworks">
          <Combobox.Item value="react">React</Combobox.Item>
        </Combobox.Content>
      </Combobox.Root>,
    );

    await user.click(screen.getByRole("combobox", { name: "Framework" }));
    await user.keyboard("{Enter}");

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("listbox", { hidden: true })).toBeInTheDocument();
  });

  it("keeps the committed value when Escape closes the popup", async () => {
    const user = userEvent.setup();
    renderCombobox();

    const input = screen.getByRole("combobox", { name: "Framework" });
    await user.click(screen.getByRole("option", { hidden: true, name: "React" }));
    await user.type(input, "zzz");
    await user.keyboard("{Escape}");

    // Escape abandons the query, so the text returns to the committed value
    expect(input).toHaveValue("React");
  });
});
