import { render, screen } from "@testing-library/react";

import { Accordion } from "../Accordion";
import { type HeadingLevel } from "../../types";

describe("Accordion displayNames", () => {
  it("sets a displayName on the compound and each sub-component", () => {
    // Assert — empty displayNames would render each as anonymous in DevTools.
    // `Accordion`, `Accordion.Root`, and the underlying function are one object
    // (Object.assign compound), so the compound's "Accordion" alias is the
    // observable Root displayName; the sub-components are distinct objects.
    expect(Accordion.displayName).toBe("Accordion");
    expect(Accordion.Item.displayName).toBe("AccordionItem");
    expect(Accordion.Header.displayName).toBe("AccordionHeader");
    expect(Accordion.Trigger.displayName).toBe("AccordionTrigger");
    expect(Accordion.Content.displayName).toBe("AccordionContent");
    expect(Accordion.TriggerIcon.displayName).toBe("AccordionTriggerIcon");
  });
});

describe("Accordion basic rendering tests", () => {
  it('should apply the attribute data-orientation="vertical" to the accordion by default', () => {
    // Arrange
    render(<Accordion.Root data-testid="test-accordion" />);
    const accordion = screen.getByTestId("test-accordion");

    // Assert
    expect(accordion).toHaveAttribute("data-orientation", "vertical");
  });

  it('should apply the attribute data-orientation="horizontal" to the accordion when orientation="horizontal" is provided', () => {
    // Arrange
    render(
      <Accordion.Root
        data-testid="test-accordion"
        orientation="horizontal"
      />,
    );
    const accordion = screen.getByTestId("test-accordion");

    // Assert
    expect(accordion).toHaveAttribute("data-orientation", "horizontal");
  });

  it("should NOT apply aria-orientation to the accordion root", () => {
    // Arrange
    render(
      <Accordion.Root
        data-testid="test-accordion"
        orientation="horizontal"
      />,
    );
    const accordion = screen.getByTestId("test-accordion");

    // Assert
    expect(accordion).not.toHaveAttribute("aria-orientation");
  });

  it('should apply the attribute aria-expanded="false" to the accordion item trigger by default', () => {
    // Arrange
    const title = "Accordion Trigger 1";
    render(
      <Accordion.Root data-testid="test-accordion">
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const accordionItemTrigger = screen.getByRole("button", { name: title });

    // Assert
    expect(accordionItemTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("should give the accordion item trigger a unique id", () => {
    // Arrange
    const title = "Accordion Trigger 1";
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const accordionItemTrigger = screen.getByRole("button", { name: title });

    // Assert
    expect(accordionItemTrigger).toHaveAttribute(
      "id",
      expect.stringContaining("-heading-"),
    );
  });

  it('should apply the correct "aria-controls" attribute to the accordion item trigger button', () => {
    // Arrange
    const title = "Accordion Trigger 1";
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const accordionItemTrigger = screen.getByRole("button", { name: title });

    // Assert
    expect(accordionItemTrigger).toHaveAttribute(
      "aria-controls",
      expect.stringContaining("-panel-"),
    );
  });

  it('should apply the aria-hidden="true" attribute to the accordion trigger icon wrapper', () => {
    // Arrange
    const title = "Accordion Trigger 1";
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>
              {title}
              <Accordion.TriggerIcon>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
              </Accordion.TriggerIcon>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const accordionItemTrigger = screen.getByRole("button", { name: title });
    const iconWrapper = accordionItemTrigger.querySelector("[aria-hidden='true']");

    // Assert
    expect(iconWrapper).toHaveAttribute("aria-hidden", "true");
  });

  it('should apply aria-hidden="true" to the icon wrapper when the icon is a React component (not an inline DOM element)', () => {
    // Arrange — simulates lucide-react, react-icons, or any custom icon component
    const ComponentIcon = () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path d="M5 12h14" />
      </svg>
    );
    const title = "Accordion Trigger 1";
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>
              {title}
              <Accordion.TriggerIcon>
                <ComponentIcon />
              </Accordion.TriggerIcon>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const trigger = screen.getByRole("button", { name: title });
    const iconWrapper = trigger.querySelector("[aria-hidden='true']");

    // Assert
    expect(iconWrapper).not.toBeNull();
    expect(iconWrapper).toHaveAttribute("aria-hidden", "true");
  });

  it("should give the accordion item content panel a unique id", () => {
    // Arrange
    const title = "Accordion Trigger 1";
    const content = "Accordion Content 1";
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>{content}</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const accordionItemPanel = screen.getByText(content);

    // Assert
    expect(accordionItemPanel).toHaveAttribute(
      "id",
      expect.stringContaining("-panel-"),
    );
  });

  it('should apply the correct "aria-labelledby" attribute to the accordion item content panel', () => {
    // Arrange
    const title = "Accordion Trigger 1";
    const content = "Accordion Content 1";
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>{content}</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const accordionItemPanel = screen.getByText(content);

    // Assert
    expect(accordionItemPanel).toHaveAttribute(
      "aria-labelledby",
      expect.stringContaining("-heading-"),
    );
  });

  it('should apply the attribute role="region" to the accordion item content panel', () => {
    // Arrange
    const title = "Accordion Trigger 1";
    const content = "Accordion Content 1";
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>{content}</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const accordionItemPanel = screen.getByText(content);

    // Assert
    expect(accordionItemPanel).toHaveAttribute("role", "region");
  });

  it("accordion item content panel should not be visible by default", () => {
    // Arrange
    const title = "Accordion Trigger 1";
    const content = "Accordion Content 1";
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>{content}</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const accordionItemPanel = screen.getByText(content);

    // Assert
    expect(accordionItemPanel).not.toBeVisible();
  });

  it("accordion item content panel should have a hidden attribute by default", () => {
    // Arrange
    const title = "Accordion Trigger 1";
    const content = "Accordion Content 1";
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>{content}</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const accordionItemPanel = screen.getByText(content);

    // Assert
    expect(accordionItemPanel).toHaveAttribute("hidden");
  });

  it("should render the accordion header as an h3 element by default", () => {
    // Arrange
    const title = "Accordion Trigger 1";
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const accordionItemTrigger = screen.getByRole("button", { name: title });
    const accordionHeader = accordionItemTrigger.parentElement;

    // Assert
    expect(accordionHeader?.tagName).toBe("H3");
  });

  it.each([
    { level: 1 as HeadingLevel },
    { level: 2 as HeadingLevel },
    { level: 3 as HeadingLevel },
    { level: 4 as HeadingLevel },
    { level: 5 as HeadingLevel },
    { level: 6 as HeadingLevel },
  ])(
    "should render the accordion header as an h$level element when level=$level is provided",
    ({ level }) => {
      // Arrange
      const title = "Accordion Trigger 1";
      render(
        <Accordion.Root>
          <Accordion.Item>
            <Accordion.Header level={level}>
              <Accordion.Trigger>{title}</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content>Content</Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>,
      );
      const accordionItemTrigger = screen.getByRole("button", {
        name: title,
      });
      const accordionHeader = accordionItemTrigger.parentElement;

      // Assert
      expect(accordionHeader?.tagName).toBe(`H${level}`);
    },
  );
});
