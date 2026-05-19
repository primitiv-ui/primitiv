import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DirectionProvider } from "../../DirectionProvider";
import { Tabs } from "../Tabs";
import { TabsReadingDirection } from "../types";

describe("Tabs reading direction tests", () => {
  it('should have the dir attribute set to "ltr" by default', () => {
    // Arrange
    render(<Tabs.Root data-testid="tabs-root" />);
    const tabsRoot = screen.getByTestId("tabs-root");

    // Assert
    expect(tabsRoot).toHaveAttribute("dir", "ltr");
  });

  it.each(["ltr", "rtl"] as TabsReadingDirection[])(
    "should accept dir prop set to %s by default",
    (direction) => {
      // Arrange
      render(<Tabs.Root data-testid="tabs-root" dir={direction} />);
      const tabsRoot = screen.getByTestId("tabs-root");

      // Assert
      expect(tabsRoot).toHaveAttribute("dir", direction);
    },
  );

  it("should inherit reading direction from a DirectionProvider", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <DirectionProvider dir="rtl">
        <Tabs.Root data-testid="tabs-root" defaultValue="tab1">
          <Tabs.List label="Test tabs">
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
            <Tabs.Trigger value="tab3">Tab 3</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content 1</Tabs.Content>
          <Tabs.Content value="tab2">Content 2</Tabs.Content>
          <Tabs.Content value="tab3">Content 3</Tabs.Content>
        </Tabs.Root>
      </DirectionProvider>,
    );

    // Assert — provider direction reaches both the DOM and the keyboard
    expect(screen.getByTestId("tabs-root")).toHaveAttribute("dir", "rtl");

    // Act — in RTL, Arrow Left moves forward
    await user.tab();
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(screen.getByRole("tab", { name: "Tab 2" })).toHaveFocus();
  });
});
