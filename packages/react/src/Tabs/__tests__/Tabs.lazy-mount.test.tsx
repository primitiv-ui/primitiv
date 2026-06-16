import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Tabs } from "../index.ts";

function renderTabs(lazyMount: boolean) {
  return render(
    <Tabs.Root defaultValue="tab1" lazyMount={lazyMount}>
      <Tabs.List label="Test tabs">
        <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
        <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
        <Tabs.Trigger value="tab3">Tab 3</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="tab1">Content 1</Tabs.Content>
      <Tabs.Content value="tab2">Content 2</Tabs.Content>
      <Tabs.Content value="tab3">Content 3</Tabs.Content>
    </Tabs.Root>,
  );
}

describe("Tabs lazyMount", () => {
  it("should render inactive panel children on initial mount by default (no lazyMount)", () => {
    renderTabs(false);

    expect(screen.getByText("Content 2")).toBeInTheDocument();
    expect(screen.getByText("Content 3")).toBeInTheDocument();
  });

  it("should not render inactive panel children on initial mount when lazyMount is true", () => {
    renderTabs(true);

    expect(screen.queryByText("Content 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Content 3")).not.toBeInTheDocument();
  });

  it("should render the default active panel children on mount even when lazyMount is true", () => {
    renderTabs(true);

    expect(screen.getByText("Content 1")).toBeInTheDocument();
  });

  it("should render a panel's children after its tab is first activated", async () => {
    const user = userEvent.setup();
    renderTabs(true);

    await user.click(screen.getByRole("tab", { name: "Tab 2" }));

    expect(screen.getByText("Content 2")).toBeInTheDocument();
  });

  it("should keep panel children mounted after switching away from a previously activated tab", async () => {
    const user = userEvent.setup();
    renderTabs(true);

    await user.click(screen.getByRole("tab", { name: "Tab 2" }));
    await user.click(screen.getByRole("tab", { name: "Tab 1" }));

    // Tab 2's content stays in the DOM — lazy mount, not unmount-on-hide.
    expect(screen.getByText("Content 2")).toBeInTheDocument();
  });
});
