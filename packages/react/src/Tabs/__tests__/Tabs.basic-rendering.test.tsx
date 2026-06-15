import { render, screen } from "@testing-library/react";

import { Tabs, TabsOrientation } from "../index.ts";

describe("Tabs basic rendering tests", () => {
  describe("Tabs.Root", () => {
    it("should render the Tabs.Root component", () => {
      // Arrange
      render(<Tabs.Root data-testid="tabs-root" />);
      const tabsRoot = screen.getByTestId("tabs-root");

      // Assert
      expect(tabsRoot).toBeVisible();
    });

    it("should accept a className prop", () => {
      // Arrange
      const testClass = "custom-tabs-root";
      render(<Tabs.Root className={testClass} data-testid="tabs-root" />);
      const tabsRoot = screen.getByTestId("tabs-root");

      // Assert
      expect(tabsRoot).toHaveAttribute("class", testClass);
    });

    it("should apply a className of empty string by default when not specified", () => {
      // Arrange
      render(<Tabs.Root data-testid="tabs-root" />);
      const tabsRoot = screen.getByTestId("tabs-root");

      // Assert
      expect(tabsRoot).toHaveAttribute("class", "");
    });

    it('should apply a data-orientation attribute of "horizontal" by default when not specified', () => {
      // Arrange
      render(<Tabs.Root data-testid="tabs-root" />);
      const tabsRoot = screen.getByTestId("tabs-root");

      // Assert
      expect(tabsRoot).toHaveAttribute("data-orientation", "horizontal");
    });

    it.each(["horizontal", "vertical"] as TabsOrientation[])(
      "should accept an orientation prop",
      (orientation) => {
        // Arrange
        render(<Tabs.Root orientation={orientation} data-testid="tabs-root" />);
        const tabsRoot = screen.getByTestId("tabs-root");

        // Assert
        expect(tabsRoot).toHaveAttribute("data-orientation", orientation);
      },
    );
  });

  describe("Tabs.List", () => {
    it("should render the Tabs.List component", () => {
      // Arrange
      render(
        <Tabs.Root>
          <Tabs.List label="test label" />
        </Tabs.Root>,
      );
      const tabList = screen.getByRole("tablist");

      expect(tabList).toBeVisible();
    });

    it("should require a label prop when aria-labelledby is not provided", () => {
      // Arrange
      const testLabel = "test label";
      render(
        <Tabs.Root>
          <Tabs.List label={testLabel} />
        </Tabs.Root>,
      );
      const tabList = screen.getByLabelText(testLabel);

      expect(tabList).toBeVisible();
    });

    it("should require an aria-labelledby prop when label is not provided", () => {
      // Arrange
      const testLabel = "test label";
      const testLabelId = "#test-label";
      render(
        <>
          <h2 id={testLabelId}>{testLabel}</h2>
          <Tabs.Root>
            <Tabs.List ariaLabelledBy={testLabelId} />
          </Tabs.Root>
          ,
        </>,
      );
      const tabList = screen.getByLabelText(testLabel);

      expect(tabList).toHaveAttribute("aria-labelledby", "#test-label");
    });

    it("should accept a className prop", () => {
      // Arrange
      const testClass = "test-class";
      render(
        <Tabs.Root>
          <Tabs.List label="test label" className={testClass} />
        </Tabs.Root>,
      );
      const tabList = screen.getByRole("tablist");

      expect(tabList).toHaveAttribute("class", testClass);
    });

    it("should apply a className of empty string by default when not specified", () => {
      // Arrange
      render(
        <Tabs.Root>
          <Tabs.List label="test label" />
        </Tabs.Root>,
      );
      const tabList = screen.getByRole("tablist");

      // Assert
      expect(tabList).toHaveAttribute("class", "");
    });

    it('should have an aria-orientation attribute of "horizontal" by default when not specified', () => {
      // Arrange
      render(
        <Tabs.Root>
          <Tabs.List label="test label" />
        </Tabs.Root>,
      );
      const tabList = screen.getByRole("tablist");

      // Assert
      expect(tabList).toHaveAttribute("aria-orientation", "horizontal");
    });

    it.each(["horizontal", "vertical"] as TabsOrientation[])(
      "should render the correct aria-orientation attribute when supplied to the Tabs.Root component",
      (orientation) => {
        // Arrange
        render(
          <Tabs.Root orientation={orientation}>
            <Tabs.List label="test label" />
          </Tabs.Root>,
        );
        const tabList = screen.getByRole("tablist");

        // Assert
        expect(tabList).toHaveAttribute("aria-orientation", orientation);
      },
    );

    it('should render a data-orientation attribute of "horizontal" by default when not specified', () => {
      // Arrange
      render(
        <Tabs.Root>
          <Tabs.List label="test label" />
        </Tabs.Root>,
      );
      const tabList = screen.getByRole("tablist");

      // Assert
      expect(tabList).toHaveAttribute("data-orientation", "horizontal");
    });

    it.each(["horizontal", "vertical"] as TabsOrientation[])(
      "should render the correct data-orientation attribute when supplied to the Tabs.Root component",
      (orientation) => {
        // Arrange
        render(
          <Tabs.Root defaultValue="tab1" orientation={orientation}>
            <Tabs.List label="test label">
              <Tabs.Trigger value="tab1" />
            </Tabs.List>
            <Tabs.Content value="tab1" />
          </Tabs.Root>,
        );
        const tabList = screen.getByRole("tablist");

        // Assert
        expect(tabList).toHaveAttribute("data-orientation", orientation);
      },
    );
  });

  describe("Tabs.Trigger", () => {
    it("should render the Tabs.Trigger component", () => {
      // Arrange
      render(
        <Tabs.Root>
          <Tabs.List label="test label">
            <Tabs.Trigger value="tab1" />
          </Tabs.List>
        </Tabs.Root>,
      );
      const tabTrigger = screen.getByRole("tab");

      expect(tabTrigger).toBeVisible();
    });

    it('should render button with the type attribute of "button"', () => {
      // Arrange
      render(
        <Tabs.Root>
          <Tabs.List label="test label">
            <Tabs.Trigger value="tab1" />
          </Tabs.List>
        </Tabs.Root>,
      );
      const tabTrigger = screen.getByRole("tab");

      expect(tabTrigger).toHaveAttribute("type", "button");
    });

    it("should accept a className prop", () => {
      // Arrange
      const testClass = "test-class";
      render(
        <Tabs.Root>
          <Tabs.List label="test label">
            <Tabs.Trigger value="tab1" className={testClass} />
          </Tabs.List>
        </Tabs.Root>,
      );
      const tabTrigger = screen.getByRole("tab");

      expect(tabTrigger).toHaveAttribute("class", testClass);
    });

    it("should apply a className of empty string by default when not specified", () => {
      // Arrange
      render(
        <Tabs.Root>
          <Tabs.List label="test label">
            <Tabs.Trigger value="tab1" />
          </Tabs.List>
        </Tabs.Root>,
      );
      const tabTrigger = screen.getByRole("tab");

      expect(tabTrigger).toHaveAttribute("class", "");
    });

    it("should apply a generated id for the tab that associates with the relevant content panel", () => {
      // Arrange
      render(
        <Tabs.Root defaultValue="tab1">
          <Tabs.List label="test label">
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Tab Content 1</Tabs.Content>
        </Tabs.Root>,
      );
      const tabTrigger = screen.getByRole("tab", { name: "Tab 1" });

      expect(tabTrigger).toHaveAttribute(
        "id",
        expect.stringContaining("-trigger-tab1"),
      );
    });

    it("should apply a generated aria-controls for the tab that associates with the relevant content panel", () => {
      // Arrange
      render(
        <Tabs.Root defaultValue="tab1">
          <Tabs.List label="test label">
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Tab Content 1</Tabs.Content>
        </Tabs.Root>,
      );
      const tabTrigger = screen.getByRole("tab", { name: "Tab 1" });

      expect(tabTrigger).toHaveAttribute(
        "aria-controls",
        expect.stringContaining("-panel-tab1"),
      );
    });

    it("should accept a children prop for the tab label", () => {
      // Arrange
      const testTriggerLabel = "Test Trigger";
      render(
        <Tabs.Root>
          <Tabs.List label="test label">
            <Tabs.Trigger value="tab1">{testTriggerLabel}</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>,
      );
      const tabTrigger = screen.getByRole("tab", { name: testTriggerLabel });

      expect(tabTrigger).toHaveTextContent(testTriggerLabel);
    });

    it('should render a data-orientation attribute of "horizontal" by default when not specified', () => {
      // Arrange
      render(
        <Tabs.Root>
          <Tabs.List label="test label">
            <Tabs.Trigger value="tab1" />
          </Tabs.List>
        </Tabs.Root>,
      );
      const tabTrigger = screen.getByRole("tab");

      // Assert
      expect(tabTrigger).toHaveAttribute("data-orientation", "horizontal");
    });

    it.each(["horizontal", "vertical"] as TabsOrientation[])(
      "should render the correct data-orientation attribute when supplied to the Tabs.Root component",
      (orientation) => {
        // Arrange
        render(
          <Tabs.Root orientation={orientation}>
            <Tabs.List label="test label">
              <Tabs.Trigger value="tab1" />
            </Tabs.List>
          </Tabs.Root>,
        );
        const tabTrigger = screen.getByRole("tab");

        // Assert
        expect(tabTrigger).toHaveAttribute("data-orientation", orientation);
      },
    );
  });

  describe("Tabs.Content", () => {
    it("should render the Tabs.Content component", () => {
      // Arrange
      render(
        <Tabs.Root defaultValue="tab1">
          <Tabs.List label="test label">
            <Tabs.Trigger value="tab1" />
          </Tabs.List>
          <Tabs.Content value="tab1" />
        </Tabs.Root>,
      );
      const tabContent = screen.getByRole("tabpanel");

      expect(tabContent).toBeVisible();
    });

    it("should accept a className prop", () => {
      // Arrange
      const testClass = "test-class";
      render(
        <Tabs.Root defaultValue="tab1">
          <Tabs.List label="test label">
            <Tabs.Trigger value="tab1" />
          </Tabs.List>
          <Tabs.Content value="tab1" className={testClass} />
        </Tabs.Root>,
      );
      const tabContent = screen.getByRole("tabpanel");

      expect(tabContent).toHaveAttribute("class", testClass);
    });

    it("should apply a className of empty string by default when not specified", () => {
      // Arrange
      render(
        <Tabs.Root defaultValue="tab1">
          <Tabs.List label="test label">
            <Tabs.Trigger value="tab1" />
          </Tabs.List>
          <Tabs.Content value="tab1" />
        </Tabs.Root>,
      );
      const tabContent = screen.getByRole("tabpanel");

      expect(tabContent).toHaveAttribute("class", "");
    });

    it("should render children correctly", () => {
      // Arrange
      render(
        <Tabs.Root defaultValue="tab1">
          <Tabs.List label="test label">
            <Tabs.Trigger value="tab1" />
          </Tabs.List>
          <Tabs.Content value="tab1">
            <p>Test Content</p>
          </Tabs.Content>
        </Tabs.Root>,
      );
      const testContent = screen.getByText("Test Content");

      expect(testContent).toBeVisible();
    });

    it("should apply a generated id for the content panel that associates with the relevant tab", () => {
      // Arrange
      render(
        <Tabs.Root defaultValue="tab1">
          <Tabs.List label="test label">
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Tab Content 1</Tabs.Content>
        </Tabs.Root>,
      );
      const tabTrigger = screen.getByRole("tabpanel", { name: "Tab 1" });

      expect(tabTrigger).toHaveAttribute(
        "id",
        expect.stringContaining("-panel-tab1"),
      );
    });

    it("should apply a generated aria-labelledby for the content panel that associates with the relevant tab", () => {
      // Arrange
      render(
        <Tabs.Root defaultValue="tab1">
          <Tabs.List label="test label">
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Tab Content 1</Tabs.Content>
        </Tabs.Root>,
      );
      const tabTrigger = screen.getByRole("tabpanel", { name: "Tab 1" });

      expect(tabTrigger).toHaveAttribute(
        "aria-labelledby",
        expect.stringContaining("-trigger-tab1"),
      );
    });

    it('should render a data-orientation attribute of "horizontal" by default when not specified', () => {
      // Arrange
      render(
        <Tabs.Root defaultValue="tab1">
          <Tabs.List label="test label">
            <Tabs.Trigger value="tab1" />
          </Tabs.List>
          <Tabs.Content value="tab1" />
        </Tabs.Root>,
      );
      const tabContent = screen.getByRole("tabpanel");

      // Assert
      expect(tabContent).toHaveAttribute("data-orientation", "horizontal");
    });

    it.each(["horizontal", "vertical"] as TabsOrientation[])(
      "should render the correct data-orientation attribute when supplied to the Tabs.Root component",
      (orientation) => {
        // Arrange
        render(
          <Tabs.Root defaultValue="tab1" orientation={orientation}>
            <Tabs.List label="test label">
              <Tabs.Trigger value="tab1" />
            </Tabs.List>
            <Tabs.Content value="tab1" />
          </Tabs.Root>,
        );
        const tabContent = screen.getByRole("tabpanel");

        // Assert
        expect(tabContent).toHaveAttribute("data-orientation", orientation);
      },
    );
  });

  describe("context errors", () => {
    it.each([
      ["Tabs.List", () => <Tabs.List label="test label" />],
      ["Tabs.Trigger", () => <Tabs.Trigger value="tab1" />],
      ["Tabs.Content", () => <Tabs.Content value="tab1" />],
    ] as const)(
      "should throw an error when %s is used outside Tabs.Root",
      (_, ComponentRenderer) => {
        // Arrange & Act & Assert
        expect(() => {
          render(ComponentRenderer());
        }).toThrow("Component must be rendered as a child of Tabs.Root");
      },
    );
  });
});
