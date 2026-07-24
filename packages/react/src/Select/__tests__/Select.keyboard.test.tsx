import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { Select } from "../Select";

function renderSelect(props: Parameters<typeof Select.Root>[0] = {}) {
  return render(
    <Select.Root {...props}>
      <Select.Trigger>
        <Select.Value placeholder="Pick one" />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="react">React</Select.Item>
        <Select.Item value="vue">Vue</Select.Item>
        <Select.Item value="svelte" disabled>
          Svelte
        </Select.Item>
        <Select.Item value="solid">Solid</Select.Item>
      </Select.Content>
    </Select.Root>,
  );
}

function option(name: RegExp | string) {
  return screen.getByRole("option", { name, hidden: true });
}

describe("Select keyboard navigation", () => {
  it("focuses the first enabled option on open when nothing is selected", async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole("button"));

    expect(option("React")).toHaveFocus();
  });

  it("focuses the selected option on open", async () => {
    const user = userEvent.setup();
    renderSelect({ defaultValue: "vue" });

    await user.click(screen.getByRole("button"));

    expect(option("Vue")).toHaveFocus();
  });

  it("moves focus with ArrowDown/ArrowUp, skipping disabled and wrapping", async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole("button"));
    await user.keyboard("{ArrowDown}"); // React -> Vue
    expect(option("Vue")).toHaveFocus();

    await user.keyboard("{ArrowDown}"); // Vue -> Solid (skips disabled Svelte)
    expect(option("Solid")).toHaveFocus();

    await user.keyboard("{ArrowDown}"); // Solid -> React (wrap)
    expect(option("React")).toHaveFocus();

    await user.keyboard("{ArrowUp}"); // React -> Solid (wrap back)
    expect(option("Solid")).toHaveFocus();

    await user.keyboard("{ArrowUp}"); // Solid -> Vue (previous, no wrap)
    expect(option("Vue")).toHaveFocus();
  });

  it("jumps to first/last enabled option with Home/End", async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole("button"));
    await user.keyboard("{End}");
    expect(option("Solid")).toHaveFocus();

    await user.keyboard("{Home}");
    expect(option("React")).toHaveFocus();
  });

  it("selects the focused option with Enter and closes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderSelect({ onValueChange });

    await user.click(screen.getByRole("button"));
    await user.keyboard("{ArrowDown}"); // focus Vue
    await user.keyboard("{Enter}");

    expect(onValueChange).toHaveBeenCalledWith("vue");
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  });

  it("selects the first option with Enter when it is the focused one", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Select.Root onValueChange={onValueChange}>
        <Select.Trigger>
          <Select.Value placeholder="Pick one" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="react">React</Select.Item>
          <Select.Item value="vue">Vue</Select.Item>
        </Select.Content>
      </Select.Root>,
    );

    await user.click(screen.getByRole("button")); // opens, focuses React (index 0)
    await user.keyboard("{Enter}"); // index 0 is a valid selection, not "< 0"

    expect(onValueChange).toHaveBeenCalledWith("react");
  });

  it("typeahead focuses the option whose label starts with the typed text", async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole("button"));
    await user.keyboard("so");

    expect(option("Solid")).toHaveFocus();
  });
});
