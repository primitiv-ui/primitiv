import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode, createRef, type ReactElement } from "react";

import { Accordion } from "../Accordion";

// Accordion's DOM behaviour runs in the shared AccordionController from
// @primitiv-ui/web (RFC 0033 §3.4). These cover what hosting it adds: one
// controller per root under StrictMode, the root's ref still reaching the
// consumer, and a consumer onKeyDown running beside the keyboard contract.

function items(onKeyDown?: () => void): ReactElement[] {
  return ["one", "two"].map((value) => (
    <Accordion.Item key={value} value={value}>
      <Accordion.Header>
        <Accordion.Trigger onKeyDown={onKeyDown}>{value}</Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content>{`${value} panel`}</Accordion.Content>
    </Accordion.Item>
  ));
}

describe("Accordion on the shared controller", () => {
  it("toggles once per click under StrictMode, whose effects run twice", async () => {
    // Arrange
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StrictMode>
        <Accordion.Root multiple value={[]} onValueChange={onValueChange}>
          {items()}
        </Accordion.Root>
      </StrictMode>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "one" }));

    // Assert
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(["one"]);
  });

  it("passes the root's ref through to the consumer", () => {
    // Arrange
    const ref = createRef<HTMLDivElement>();

    // Act
    render(<Accordion.Root ref={ref}>{items()}</Accordion.Root>);

    // Assert
    expect(ref.current?.getAttribute("data-orientation")).toBe("vertical");
  });

  it("keeps toggling and moving focus when the root is given a ref", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Accordion.Root ref={createRef<HTMLDivElement>()}>{items()}</Accordion.Root>);
    screen.getByRole("button", { name: "one" }).focus();

    // Act
    await user.keyboard("{ArrowDown}{Enter}");

    // Assert
    expect(screen.getByRole("button", { name: "two" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "two" })).toHaveAttribute("aria-expanded", "true");
  });

  it("runs a consumer onKeyDown beside the keyboard contract, rather than in place of it", async () => {
    // Arrange
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(<Accordion.Root>{items(onKeyDown)}</Accordion.Root>);
    screen.getByRole("button", { name: "one" }).focus();

    // Act
    await user.keyboard("{Enter}{ArrowDown}");

    // Assert
    expect(onKeyDown).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "one" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "two" })).toHaveFocus();
  });

  it("never calls a consumer onClick on a disabled trigger, as before the controller", async () => {
    // Arrange
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Accordion.Root>
        <Accordion.Item value="one">
          <Accordion.Header>
            <Accordion.Trigger disabled onClick={onClick}>
              one
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>one panel</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "one" }));

    // Assert
    expect(onClick).not.toHaveBeenCalled();
  });
});
