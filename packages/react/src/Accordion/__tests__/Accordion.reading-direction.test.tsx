import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DirectionProvider } from "../../DirectionProvider";
import { Accordion } from "../Accordion";

describe("Accordion reading direction tests", () => {
  it('should accept dir="ltr" prop', () => {
    // Arrange
    render(<Accordion.Root data-testid="accordion" dir="ltr" />);

    // Assert
    expect(screen.getByTestId("accordion")).toHaveAttribute("dir", "ltr");
  });

  it('should accept dir="rtl" prop', () => {
    // Arrange
    render(<Accordion.Root data-testid="accordion" dir="rtl" />);

    // Assert
    expect(screen.getByTestId("accordion")).toHaveAttribute("dir", "rtl");
  });

  it('should move focus to the next trigger using "ArrowLeft" when orientation="horizontal" and dir="rtl"', async () => {
    // Arrange
    const user = userEvent.setup();
    const title1 = "Trigger 1";
    const title2 = "Trigger 2";
    const title3 = "Trigger 3";
    render(
      <Accordion.Root orientation="horizontal" dir="rtl">
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title1}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title2}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title3}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const trigger2 = screen.getByRole("button", { name: title2 });

    // Act — in RTL, "forward" is ArrowLeft
    await user.tab();
    await user.keyboard("[ArrowLeft]");

    // Assert
    expect(trigger2).toHaveFocus();
  });

  it('should move focus to the previous trigger using "ArrowRight" when orientation="horizontal" and dir="rtl"', async () => {
    // Arrange
    const user = userEvent.setup();
    const title1 = "Trigger 1";
    const title2 = "Trigger 2";
    const title3 = "Trigger 3";
    render(
      <Accordion.Root orientation="horizontal" dir="rtl">
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title1}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title2}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title3}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const trigger1 = screen.getByRole("button", { name: title1 });

    // Act — in RTL, "back" is ArrowRight; tab to trigger 2 then go back
    await user.tab();
    await user.tab();
    await user.keyboard("[ArrowRight]");

    // Assert
    expect(trigger1).toHaveFocus();
  });

  it("should inherit reading direction from a DirectionProvider", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <DirectionProvider dir="rtl">
        <Accordion.Root data-testid="accordion" orientation="horizontal">
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content>Content</Accordion.Content>
          </Accordion.Item>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content>Content</Accordion.Content>
          </Accordion.Item>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 3</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content>Content</Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>
      </DirectionProvider>,
    );

    // Assert — provider direction reaches both the DOM and the keyboard
    expect(screen.getByTestId("accordion")).toHaveAttribute("dir", "rtl");

    // Act — in RTL, "forward" is ArrowLeft
    await user.tab();
    await user.keyboard("[ArrowLeft]");

    // Assert
    expect(screen.getByRole("button", { name: "Trigger 2" })).toHaveFocus();
  });
});
