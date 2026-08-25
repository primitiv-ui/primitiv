import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
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

  it("excludes an indicator nested inside a consumer wrapper from the mirror", () => {
    // A styled layer wraps Select.ItemIndicator in its own component (the
    // registry does exactly this), so the mirror cannot identify the indicator
    // by the element's own type. Mirroring it into the trigger would render it
    // outside any Select.Item and throw.
    function StyledIndicator({ children }: { children: ReactNode }) {
      return <Select.ItemIndicator className="mark">{children}</Select.ItemIndicator>;
    }

    render(
      <Select.Root defaultValue="react">
        <Select.Trigger>
          <Select.Value placeholder="Pick" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="react">
            React
            <StyledIndicator>✓</StyledIndicator>
          </Select.Item>
        </Select.Content>
      </Select.Root>,
    );

    const trigger = screen.getByRole("button");
    expect(trigger).toHaveTextContent("React");
    expect(within(trigger).queryByText("✓")).not.toBeInTheDocument();
  });

  it("keeps a forceMount indicator out of the mirror too", () => {
    // forceMount keeps the mark in the DOM while its row is unselected, for CSS
    // animation inside the listbox. The trigger's mirrored copy must still drop
    // it — this is the only path where the mirror check is load-bearing, since
    // an ordinary indicator already self-hides on the mirror's unselected state.
    render(
      <Select.Root defaultValue="react">
        <Select.Trigger>
          <Select.Value placeholder="Pick" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="react">
            React
            <Select.ItemIndicator forceMount data-testid="mark">
              ✓
            </Select.ItemIndicator>
          </Select.Item>
        </Select.Content>
      </Select.Root>,
    );

    const trigger = screen.getByRole("button");
    expect(trigger).toHaveTextContent("React");
    expect(within(trigger).queryByTestId("mark")).not.toBeInTheDocument();
    // ...while the row's own copy stays mounted.
    expect(screen.getByTestId("mark")).toBeInTheDocument();
  });

  it("flags the placeholder state with data-placeholder", () => {
    renderSelect();

    expect(screen.getByText("Pick a framework")).toHaveAttribute(
      "data-placeholder",
      "",
    );
  });

  it("drops data-placeholder once an item is selected", () => {
    renderSelect({ defaultValue: "react" });

    const trigger = screen.getByRole("button");
    expect(within(trigger).getByText("React").closest("span")).not.toHaveAttribute(
      "data-placeholder",
    );
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
