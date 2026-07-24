import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Select } from "../Select";

function Framework({ value, label }: { value: string; label: string }) {
  return (
    <Select.Item value={value}>
      <svg data-testid={`icon-${value}`} aria-hidden />
      {label}
      <Select.ItemIndicator>✓</Select.ItemIndicator>
    </Select.Item>
  );
}

function renderSelect(props: Parameters<typeof Select.Root>[0] = {}) {
  return render(
    <Select.Root {...props}>
      <Select.Trigger>
        <Select.Value placeholder="Pick a framework" />
      </Select.Trigger>
      <Select.Content>
        <Framework value="react" label="React" />
        <Framework value="vue" label="Vue" />
      </Select.Content>
    </Select.Root>,
  );
}

describe("Select.Value mirroring", () => {
  it("shows the placeholder when nothing is selected", () => {
    renderSelect();

    expect(screen.getByRole("button")).toHaveTextContent("Pick a framework");
  });

  it("mirrors the selected item's icon and label into the trigger", () => {
    renderSelect({ defaultValue: "react" });

    const trigger = screen.getByRole("button");
    expect(trigger).toHaveTextContent("React");
    expect(within(trigger).getByTestId("icon-react")).toBeInTheDocument();
  });

  it("excludes the ItemIndicator from the mirrored trigger content", () => {
    renderSelect({ defaultValue: "react" });

    const trigger = screen.getByRole("button");
    expect(within(trigger).queryByText("✓")).not.toBeInTheDocument();
  });

  it("drops an item's mirror registration when it unmounts", () => {
    const { rerender } = render(
      <Select.Root defaultValue="react">
        <Select.Trigger>
          <Select.Value placeholder="Nothing" />
        </Select.Trigger>
        <Select.Content>
          <Framework value="react" label="React" />
          <Framework value="vue" label="Vue" />
        </Select.Content>
      </Select.Root>,
    );
    expect(screen.getByRole("button")).toHaveTextContent("React");

    // Remove the (still-selected) react item while the Select stays mounted —
    // its registration is dropped and Value falls back to the placeholder.
    rerender(
      <Select.Root defaultValue="react">
        <Select.Trigger>
          <Select.Value placeholder="Nothing" />
        </Select.Trigger>
        <Select.Content>
          <Framework value="vue" label="Vue" />
        </Select.Content>
      </Select.Root>,
    );
    expect(screen.getByRole("button")).toHaveTextContent("Nothing");
  });

  it("updates the mirrored content when the selection changes", async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Vue"));

    const trigger = screen.getByRole("button");
    expect(trigger).toHaveTextContent("Vue");
    expect(within(trigger).getByTestId("icon-vue")).toBeInTheDocument();
  });
});

describe("Select.ItemIndicator", () => {
  it("renders only inside the selected item", async () => {
    const user = userEvent.setup();
    renderSelect({ defaultValue: "react" });

    await user.click(screen.getByRole("button"));

    // Exactly one indicator is mounted — the selected (react) item's.
    const indicators = screen.getAllByText("✓");
    expect(indicators).toHaveLength(1);
    const reactOption = screen.getByRole("option", {
      name: /React/,
      hidden: true,
    });
    expect(within(reactOption).getByText("✓")).toHaveAttribute(
      "data-state",
      "checked",
    );
  });

  it("stays mounted for an unselected item when forceMount is set", async () => {
    const user = userEvent.setup();
    render(
      <Select.Root defaultValue="react">
        <Select.Trigger>
          <Select.Value placeholder="Pick" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="react">React</Select.Item>
          <Select.Item value="vue">
            Vue
            <Select.ItemIndicator forceMount data-testid="vue-indicator">
              •
            </Select.ItemIndicator>
          </Select.Item>
        </Select.Content>
      </Select.Root>,
    );

    await user.click(screen.getByRole("button"));

    expect(screen.getByTestId("vue-indicator")).toHaveAttribute(
      "data-state",
      "unchecked",
    );
  });

  it("composes onto a custom element with asChild", async () => {
    const user = userEvent.setup();
    render(
      <Select.Root defaultValue="react">
        <Select.Trigger>
          <Select.Value placeholder="Pick" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="react">
            React
            <Select.ItemIndicator asChild>
              <i data-testid="mark">✓</i>
            </Select.ItemIndicator>
          </Select.Item>
        </Select.Content>
      </Select.Root>,
    );

    await user.click(screen.getByRole("button"));

    const mark = screen.getByTestId("mark");
    expect(mark.tagName).toBe("I");
    expect(mark).toHaveAttribute("data-state", "checked");
  });
});
