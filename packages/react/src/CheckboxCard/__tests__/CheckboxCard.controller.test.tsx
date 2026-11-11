import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode, createRef } from "react";

import { CheckboxCard } from "../CheckboxCard";

// CheckboxCard's click runs in the shared CheckboxCardController from
// @primitiv-ui/web (RFC 0033 §3.4). These cover what hosting it adds: one
// controller per card under StrictMode, the card's ref still reaching the
// consumer, a consumer onClick running beside the toggle, and a disabled
// change reaching the controller.

describe("CheckboxCard on the shared controller", () => {
  it("toggles once per click under StrictMode, whose effects run twice", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <StrictMode>
        <CheckboxCard.Root checked={false} onCheckedChange={onCheckedChange}>
          Email
        </CheckboxCard.Root>
      </StrictMode>,
    );

    // Act
    await user.click(screen.getByRole("checkbox"));

    // Assert
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("keeps toggling when given a ref, which still reaches the consumer, beside its onClick", async () => {
    // Arrange
    const user = userEvent.setup();
    const ref = createRef<HTMLButtonElement>();
    const onClick = vi.fn();
    render(
      <CheckboxCard.Root ref={ref} onClick={onClick}>
        Email
      </CheckboxCard.Root>,
    );

    // Act
    await user.click(screen.getByRole("checkbox"));

    // Assert
    expect(ref.current).toBe(screen.getByRole("checkbox"));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "true");
  });

  it("stops toggling an asChild card once it becomes disabled", async () => {
    // Arrange — a <div> has no native disabled, so only the controller can refuse.
    const user = userEvent.setup();
    const card = (disabled: boolean) => (
      <CheckboxCard.Root asChild disabled={disabled}>
        <div tabIndex={0}>Email</div>
      </CheckboxCard.Root>
    );
    const { rerender } = render(card(false));

    // Act
    rerender(card(true));
    await user.click(screen.getByRole("checkbox"));

    // Assert
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "false");
  });

  it("re-attaches the card to a replacement ref when the ref prop changes", () => {
    // Arrange
    const received: (HTMLButtonElement | null)[] = [];

    // Act
    const { rerender } = render(<CheckboxCard.Root ref={() => {}}>Email</CheckboxCard.Root>);
    rerender(<CheckboxCard.Root ref={(node) => void received.push(node)}>Email</CheckboxCard.Root>);

    // Assert
    expect(received).toContain(screen.getByRole("checkbox"));
  });
});
