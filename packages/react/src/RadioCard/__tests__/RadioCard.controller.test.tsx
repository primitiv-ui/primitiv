import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode, createRef, type ReactElement } from "react";

import { RadioCard } from "../RadioCard";

// RadioCard's DOM behaviour runs in the shared RadioCardController
// from @primitiv-ui/web (RFC 0033 §3.4). These cover what hosting it adds: one
// controller per root under StrictMode, the root's ref still reaching the
// consumer, and consumer handlers running beside the keyboard contract.

function items(handlers: { onKeyDown?: () => void; onClick?: () => void } = {}): ReactElement[] {
  return ["basic", "pro"].map((value) => (
    <RadioCard.Item key={value} value={value} {...handlers}>
      {value}
    </RadioCard.Item>
  ));
}

describe("RadioCard on the shared controller", () => {
  it("selects once per click under StrictMode, whose effects run twice", async () => {
    // Arrange
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StrictMode>
        <RadioCard.Root value="basic" onValueChange={onValueChange} aria-label="Plan">
          {items()}
        </RadioCard.Root>
      </StrictMode>,
    );

    // Act
    await user.click(screen.getByRole("radio", { name: "pro" }));

    // Assert
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("pro");
  });

  it("keeps selecting with the arrows when the root is given a ref, which still reaches the consumer", async () => {
    // Arrange
    const user = userEvent.setup();
    const ref = createRef<HTMLDivElement>();
    render(
      <RadioCard.Root defaultValue="basic" ref={ref} aria-label="Plan">
        {items()}
      </RadioCard.Root>,
    );
    screen.getByRole("radio", { name: "basic" }).focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(ref.current?.getAttribute("role")).toBe("radiogroup");
    expect(screen.getByRole("radio", { name: "pro" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "pro" })).toHaveAttribute("aria-checked", "true");
  });

  it("runs a consumer's onKeyDown and onClick beside the controller", async () => {
    // Arrange
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    const onClick = vi.fn();
    render(
      <RadioCard.Root defaultValue="basic" aria-label="Plan">
        {items({ onKeyDown, onClick })}
      </RadioCard.Root>,
    );

    // Act
    await user.click(screen.getByRole("radio", { name: "pro" }));
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("radio", { name: "basic" })).toHaveAttribute("aria-checked", "true");
  });

  it("re-attaches the root to a replacement ref when the ref prop changes", () => {
    // Arrange — the root's ref is composed with the controller's, and that
    // composition must follow a changed ref.
    const received: (HTMLDivElement | null)[] = [];

    // Act
    const { rerender } = render(
      <RadioCard.Root aria-label="Plan" ref={() => {}}>
        {items()}
      </RadioCard.Root>,
    );
    rerender(
      <RadioCard.Root aria-label="Plan" ref={(node) => void received.push(node)}>
        {items()}
      </RadioCard.Root>,
    );

    // Assert
    expect(received).toContain(screen.getByRole("radiogroup", { name: "Plan" }));
  });
});
