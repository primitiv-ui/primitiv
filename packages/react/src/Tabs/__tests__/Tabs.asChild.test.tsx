import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";

import { Tabs } from "../index.ts";

describe("Tabs.Trigger asChild", () => {
  it("renders the child element instead of a <button> when asChild is true", () => {
    render(
      <Tabs.Root defaultValue="tab1">
        <Tabs.List label="Test tabs">
          <Tabs.Trigger asChild value="tab1">
            <a href="/tab1">Tab 1</a>
          </Tabs.Trigger>
          <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="tab1">Content 1</Tabs.Content>
        <Tabs.Content value="tab2">Content 2</Tabs.Content>
      </Tabs.Root>,
    );

    const trigger = screen.getByRole("tab", { name: "Tab 1" });
    expect(trigger.tagName).toBe("A");
    expect(trigger).toHaveAttribute("href", "/tab1");
  });

  it("merges ARIA attributes onto the child element", () => {
    render(
      <Tabs.Root defaultValue="tab1">
        <Tabs.List label="Test tabs">
          <Tabs.Trigger asChild value="tab1">
            <a href="/tab1">Tab 1</a>
          </Tabs.Trigger>
          <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="tab1">Content 1</Tabs.Content>
        <Tabs.Content value="tab2">Content 2</Tabs.Content>
      </Tabs.Root>,
    );

    const trigger = screen.getByRole("tab", { name: "Tab 1" });
    expect(trigger).toHaveAttribute("role", "tab");
    expect(trigger).toHaveAttribute("aria-selected", "true");
    expect(trigger).toHaveAttribute("aria-controls");
    expect(trigger).toHaveAttribute("tabindex", "0");
  });

  it("composes child onClick with tab activation", async () => {
    const user = userEvent.setup();
    const childClick = vi.fn();

    render(
      <Tabs.Root defaultValue="tab1">
        <Tabs.List label="Test tabs">
          <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          <Tabs.Trigger asChild value="tab2">
            <a href="/tab2" onClick={childClick}>
              Tab 2
            </a>
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="tab1">Content 1</Tabs.Content>
        <Tabs.Content value="tab2">Content 2</Tabs.Content>
      </Tabs.Root>,
    );

    await user.click(screen.getByRole("tab", { name: "Tab 2" }));

    expect(childClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("tab", { name: "Tab 2" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("forwards ref to the child DOM element", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Tabs.Root defaultValue="tab1">
        <Tabs.List label="Test tabs">
          <Tabs.Trigger asChild value="tab1" ref={ref}>
            <a href="/tab1">Tab 1</a>
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="tab1">Content 1</Tabs.Content>
      </Tabs.Root>,
    );
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe("A");
  });
});
