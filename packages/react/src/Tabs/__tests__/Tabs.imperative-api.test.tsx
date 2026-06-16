import { render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";

import { Tabs, TabsImperativeApi } from "../index.ts";

describe("Tabs Imperative API", () => {
  it("should expose setActiveTab method via ref", () => {
    // Arrange
    const ref = createRef<TabsImperativeApi>();
    render(
      <Tabs.Root ref={ref} defaultValue="tab1">
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

    // Assert
    expect(typeof ref.current?.setActiveTab).toBe("function");
  });

  it("should update active tab when setActiveTab is called in uncontrolled mode", async () => {
    // Arrange
    const ref = createRef<TabsImperativeApi>();
    render(
      <Tabs.Root ref={ref} defaultValue="tab1">
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
    const tab3 = screen.getByRole("tab", { name: "Tab 3" });

    // Act
    ref.current?.setActiveTab("tab3");

    // Assert
    await waitFor(() => expect(tab3).toHaveAttribute("aria-selected", "true"));
  });

  it("should call onValueChange when setActiveTab is called in controlled mode", () => {
    // Arrange
    const ref = createRef<TabsImperativeApi>();
    const handleValueChange = vi.fn();
    render(
      <Tabs.Root ref={ref} value="tab1" onValueChange={handleValueChange}>
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

    // Act
    ref.current?.setActiveTab("tab2");

    // Assert
    expect(handleValueChange).toHaveBeenCalledWith("tab2");
  });

  it("should validate index in setActiveTab in uncontrolled mode", () => {
    // Arrange
    const ref = createRef<TabsImperativeApi>();
    render(
      <Tabs.Root ref={ref} defaultValue="tab1">
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

    // Act & Assert
    expect(() => ref.current?.setActiveTab("tab99")).toThrow(
      /Invalid tab value/i,
    );
  });

  it("should validate index in setActiveTab in controlled mode", () => {
    // Arrange
    const ref = createRef<TabsImperativeApi>();
    render(
      <Tabs.Root ref={ref} value="tab1" onValueChange={vi.fn()}>
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

    // Act & Assert
    expect(() => ref.current?.setActiveTab("tab99")).toThrow(
      /Invalid tab value/i,
    );
  });
});
