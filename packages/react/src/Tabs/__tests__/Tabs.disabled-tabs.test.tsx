import { render, screen } from "@testing-library/react";
import { Tabs } from "../Tabs";
import userEvent from "@testing-library/user-event";

describe("Tabs disabled re-registration", () => {
  it("re-registers a trigger's disabled flag when it changes after mount", async () => {
    // Arrange — automatic mode: arrowing onto a tab activates it unless the
    // trigger is registered as disabled. Tab 2 starts enabled, then disables.
    const user = userEvent.setup();
    function Fixture({ tab2Disabled }: { tab2Disabled: boolean }) {
      return (
        <Tabs.Root defaultValue="tab1">
          <Tabs.List label="Test tabs">
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="tab2" disabled={tab2Disabled}>
              Tab 2
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content 1</Tabs.Content>
          <Tabs.Content value="tab2">Content 2</Tabs.Content>
        </Tabs.Root>
      );
    }
    const { rerender } = render(<Fixture tab2Disabled={false} />);

    // Act — disable Tab 2 after mount, then arrow onto it.
    rerender(<Fixture tab2Disabled />);
    await user.tab();
    await user.keyboard("{ArrowRight}");

    // Assert — the registrar effect re-ran, so Tab 2 is focused but NOT
    // activated. A stale registration would treat it as enabled and activate
    // it on arrow (automatic mode).
    expect(screen.getByRole("tab", { name: "Tab 2" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });
});

describe("Tabs disabled tabs tests", () => {
  it("should have the aria-disabled attribute set to false by default", () => {
    // Arrange
    render(
      <Tabs.Root defaultValue="tab1">
        <Tabs.List label="Test tabs">
          <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="tab1">Content 1</Tabs.Content>
        <Tabs.Content value="tab2">Content 2</Tabs.Content>
      </Tabs.Root>,
    );
    const firstTab = screen.getByRole("tab", { name: "Tab 1" });

    // Assert
    expect(firstTab).toHaveAttribute("aria-disabled", "false");
  });

  it("should not have the native disabled attribute set when disabled prop is provided", () => {
    // Arrange
    render(
      <Tabs.Root defaultValue="tab1">
        <Tabs.List label="Test tabs">
          <Tabs.Trigger value="tab1" disabled>
            Tab 1
          </Tabs.Trigger>
          <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="tab1">Content 1</Tabs.Content>
        <Tabs.Content value="tab2">Content 2</Tabs.Content>
      </Tabs.Root>,
    );
    const firstTab = screen.getByRole("tab", { name: "Tab 1" });

    // Assert
    expect(firstTab).not.toHaveAttribute("disabled");
  });

  it("should have the aria-disabled attribute set to true when disabled prop is provided", () => {
    // Arrange
    render(
      <Tabs.Root defaultValue="tab1">
        <Tabs.List label="Test tabs">
          <Tabs.Trigger value="tab1" disabled>
            Tab 1
          </Tabs.Trigger>
          <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="tab1">Content 1</Tabs.Content>
        <Tabs.Content value="tab2">Content 2</Tabs.Content>
      </Tabs.Root>,
    );
    const firstTab = screen.getByRole("tab", { name: "Tab 1" });

    // Assert
    expect(firstTab).toHaveAttribute("aria-disabled", "true");
  });

  it("should not set the data-disabled attribute by default", () => {
    // Arrange
    render(
      <Tabs.Root defaultValue="tab1">
        <Tabs.List label="Test tabs">
          <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="tab1">Content 1</Tabs.Content>
        <Tabs.Content value="tab2">Content 2</Tabs.Content>
      </Tabs.Root>,
    );
    const firstTab = screen.getByRole("tab", { name: "Tab 1" });

    // Assert — matches the Button/Switch convention: omitted when enabled.
    expect(firstTab).not.toHaveAttribute("data-disabled");
  });

  it("should set data-disabled to an empty string when disabled prop is provided", () => {
    // Arrange
    render(
      <Tabs.Root defaultValue="tab1">
        <Tabs.List label="Test tabs">
          <Tabs.Trigger value="tab1" disabled>
            Tab 1
          </Tabs.Trigger>
          <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="tab1">Content 1</Tabs.Content>
        <Tabs.Content value="tab2">Content 2</Tabs.Content>
      </Tabs.Root>,
    );
    const firstTab = screen.getByRole("tab", { name: "Tab 1" });

    // Assert — matches the Button/Switch convention: "" when disabled.
    expect(firstTab).toHaveAttribute("data-disabled", "");
  });

  it("should not change the currently active panel when clicking on a disabled tab", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Tabs.Root defaultValue="tab1">
        <Tabs.List label="Test tabs">
          <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          <Tabs.Trigger value="tab2" disabled>
            Tab 2
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="tab1">Content 1</Tabs.Content>
        <Tabs.Content value="tab2">Content 2</Tabs.Content>
      </Tabs.Root>,
    );
    const currentActivePanel = screen.getByRole("tabpanel", { name: "Tab 1" });
    const disabledTab = screen.getByRole("tab", { name: "Tab 2" });

    // Act
    await user.click(disabledTab);

    // Assert
    expect(currentActivePanel).not.toHaveAttribute("hidden");
  });

  it.each([
    {
      name: "ArrowRight to next disabled tab",
      defaultValue: "tab1",
      triggers: [
        { value: "tab1", label: "Tab 1", disabled: false },
        { value: "tab2", label: "Tab 2", disabled: true },
      ],
      focusTab: "Tab 1",
      keyboard: "{ArrowRight}",
      activePanel: "Tab 1",
    },
    {
      name: "ArrowLeft to previous disabled tab",
      defaultValue: "tab2",
      triggers: [
        { value: "tab1", label: "Tab 1", disabled: true },
        { value: "tab2", label: "Tab 2", disabled: false },
      ],
      focusTab: "Tab 2",
      keyboard: "{ArrowLeft}",
      activePanel: "Tab 2",
    },
    {
      name: "Home to first disabled tab",
      defaultValue: "tab2",
      triggers: [
        { value: "tab1", label: "Tab 1", disabled: true },
        { value: "tab2", label: "Tab 2", disabled: false },
      ],
      focusTab: "Tab 2",
      keyboard: "{Home}",
      activePanel: "Tab 2",
    },
    {
      name: "End to last disabled tab",
      defaultValue: "tab1",
      triggers: [
        { value: "tab1", label: "Tab 1", disabled: false },
        { value: "tab2", label: "Tab 2", disabled: true },
      ],
      focusTab: "Tab 1",
      keyboard: "{End}",
      activePanel: "Tab 1",
    },
  ])(
    "should not activate a disabled tab when navigating: $name",
    async ({ defaultValue, triggers, focusTab, keyboard, activePanel }) => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Tabs.Root defaultValue={defaultValue}>
          <Tabs.List label="Test tabs">
            {triggers.map((t) => (
              <Tabs.Trigger key={t.value} value={t.value} disabled={t.disabled}>
                {t.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <Tabs.Content value="tab1">Content 1</Tabs.Content>
          <Tabs.Content value="tab2">Content 2</Tabs.Content>
        </Tabs.Root>,
      );
      const currentActivePanel = screen.getByRole("tabpanel", {
        name: activePanel,
      });

      // Act
      await user.tab();
      expect(screen.getByRole("tab", { name: focusTab })).toHaveFocus();
      await user.keyboard(keyboard);

      // Assert
      expect(currentActivePanel).not.toHaveAttribute("hidden");
    },
  );
});
