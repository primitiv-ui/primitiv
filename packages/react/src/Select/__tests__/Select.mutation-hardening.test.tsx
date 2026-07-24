import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { Select } from "../Select";

/**
 * Discriminating assertions that pin down behaviour equivalent mutants would
 * otherwise slip past (preventDefault calls, the toggle-sync listener, and
 * the exact ARIA / data-state / role wiring). Complements the behavioural
 * suites, which assert *where focus lands* but not *how* it got there.
 */

function open() {
  render(
    <Select.Root defaultValue="vue">
      <Select.Trigger>
        <Select.Value placeholder="Pick" />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="react">React</Select.Item>
        <Select.Item value="vue">Vue</Select.Item>
        <Select.Item value="solid">Solid</Select.Item>
      </Select.Content>
    </Select.Root>,
  );
  fireEvent.click(screen.getByRole("button"));
  return screen.getByRole("listbox", { hidden: true });
}

describe("Select preventDefault on handled keys", () => {
  it.each(["ArrowDown", "ArrowUp", "Home", "End", "Enter", " ", "Escape"])(
    "cancels the default action for %s",
    (key) => {
      const list = open();
      // fireEvent returns false when a handler called preventDefault.
      const notCancelled = fireEvent.keyDown(list, { key });
      expect(notCancelled).toBe(false);
    },
  );

  it("cancels the default action for a typeahead match", () => {
    const list = open();
    const notCancelled = fireEvent.keyDown(list, { key: "s" }); // matches Solid
    expect(notCancelled).toBe(false);
  });

  it("does not cancel an unhandled key", () => {
    const list = open();
    // A modifier / multi-char key falls through untouched.
    const notCancelled = fireEvent.keyDown(list, { key: "Shift" });
    expect(notCancelled).toBe(true);
  });
});

describe("Select toggle-event sync", () => {
  it("closes when the popover dispatches a toggle→closed (browser light-dismiss)", () => {
    const list = open();
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");

    // Simulate the browser's own light-dismiss: a toggle event to "closed".
    const event = new Event("toggle");
    Object.defineProperty(event, "newState", { value: "closed" });
    fireEvent(list, event);

    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  });

  it("ignores a toggle→open event (does not thrash state)", () => {
    const list = open();
    const openEvent = new Event("toggle");
    Object.defineProperty(openEvent, "newState", { value: "open" });
    fireEvent(list, openEvent);
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });
});

describe("Select selection commit + hidden form field", () => {
  it("fires onOpenChange exactly once (to false) when a selection commits", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Select.Root onOpenChange={onOpenChange}>
        <Select.Trigger>
          <Select.Value placeholder="Pick" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="react">React</Select.Item>
          <Select.Item value="vue">Vue</Select.Item>
        </Select.Content>
      </Select.Root>,
    );

    await user.click(screen.getByRole("button")); // opens
    onOpenChange.mockClear();
    await user.click(screen.getByText("Vue")); // selecting closes — exactly once

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders a hidden form <select> option for each registered item value", () => {
    const { container } = render(
      <Select.Root name="framework">
        <Select.Trigger>
          <Select.Value placeholder="Pick" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="react">React</Select.Item>
          <Select.Item value="vue">Vue</Select.Item>
        </Select.Content>
      </Select.Root>,
    );

    const hidden = container.querySelector<HTMLSelectElement>(
      'select[name="framework"]',
    )!;
    const values = Array.from(hidden.querySelectorAll("option")).map(
      (o) => o.value,
    );
    expect(values).toContain("react");
    expect(values).toContain("vue");
  });
});

describe("Select native-mode edges", () => {
  it("keeps a numeric child as the option text under native", () => {
    render(
      <Select.Root native defaultValue="1">
        <Select.Item value="1">{42}</Select.Item>
      </Select.Root>,
    );
    expect(screen.getByRole("option", { name: "42" })).toBeInTheDocument();
  });

  it("marks the matching option selected for a native controlled value", () => {
    render(
      <Select.Root native value="b" onValueChange={() => {}}>
        <Select.Item value="a">A</Select.Item>
        <Select.Item value="b">B</Select.Item>
      </Select.Root>,
    );
    expect(
      (screen.getByRole("option", { name: "B" }) as HTMLOptionElement).selected,
    ).toBe(true);
  });

  it("calls onValueChange with the chosen value under native", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Select.Root native defaultValue="a" onValueChange={onValueChange}>
        <Select.Item value="a">A</Select.Item>
        <Select.Item value="b">B</Select.Item>
      </Select.Root>,
    );
    await user.selectOptions(screen.getByRole("combobox"), "b");
    expect(onValueChange).toHaveBeenCalledWith("b");
  });
});

describe("Select rich data-disabled + typeahead reach", () => {
  it("exposes data-disabled on a rich item only when disabled", async () => {
    const user = userEvent.setup();
    render(
      <Select.Root>
        <Select.Trigger>
          <Select.Value placeholder="Pick" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="a">Enabled</Select.Item>
          <Select.Item value="b" disabled>
            Disabled
          </Select.Item>
        </Select.Content>
      </Select.Root>,
    );
    await user.click(screen.getByRole("button"));
    expect(
      screen.getByRole("option", { name: "Enabled", hidden: true }),
    ).not.toHaveAttribute("data-disabled");
    expect(screen.getByText("Disabled")).toHaveAttribute("data-disabled", "");
  });

  it("typeahead reaches the last option in a 5-item list (loop bound + modulo)", async () => {
    const user = userEvent.setup();
    render(
      <Select.Root>
        <Select.Trigger>
          <Select.Value placeholder="Pick" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="a">Alpha</Select.Item>
          <Select.Item value="b">Bravo</Select.Item>
          <Select.Item value="c">Charlie</Select.Item>
          <Select.Item value="d">Delta</Select.Item>
          <Select.Item value="e">Echo</Select.Item>
        </Select.Content>
      </Select.Root>,
    );
    await user.click(screen.getByRole("button")); // Alpha focused (index 0)
    await user.keyboard("e"); // only Echo (index 4) matches — loop must reach it
    expect(screen.getByRole("option", { name: "Echo", hidden: true })).toHaveFocus();
  });
});

describe("Select ARIA / data-state wiring", () => {
  it("wires the trigger, listbox, and options with the exact contract", async () => {
    const user = userEvent.setup();
    render(
      <Select.Root defaultValue="vue">
        <Select.Trigger>
          <Select.Value placeholder="Pick" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="react">React</Select.Item>
          <Select.Item value="vue">
            Vue
            <Select.ItemIndicator>✓</Select.ItemIndicator>
          </Select.Item>
        </Select.Content>
      </Select.Root>,
    );

    const trigger = screen.getByRole("button");
    expect(trigger).toHaveAttribute("type", "button");
    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");

    await user.click(trigger);

    const list = screen.getByRole("listbox", { hidden: true });
    expect(list).toHaveAttribute("tabindex", "-1");

    const react = screen.getByRole("option", { name: "React", hidden: true });
    const vue = screen.getByRole("option", { name: /Vue/, hidden: true });
    expect(react).toHaveAttribute("tabindex", "-1");
    expect(react).toHaveAttribute("data-state", "unchecked");
    expect(react).toHaveAttribute("aria-selected", "false");
    expect(vue).toHaveAttribute("data-state", "checked");
    expect(vue).toHaveAttribute("aria-selected", "true");
    // The indicator only mounts on the selected item, as "checked".
    expect(screen.getByText("✓")).toHaveAttribute("data-state", "checked");
  });
});
