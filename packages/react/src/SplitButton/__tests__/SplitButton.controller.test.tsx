import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode, createRef } from "react";

import { SplitButtonController } from "@primitiv-ui/web";

import { SplitButton } from "../SplitButton";

// The action's ArrowDown runs in the shared SplitButtonController from
// @primitiv-ui/web (RFC 0033 §3.4). These cover what hosting it adds: the key
// handled there, one controller per group under StrictMode, the group's and the
// action's refs still reaching the consumer, and a disabled change reaching the
// controller.

const group = (props: { disabled?: boolean; onOpenChange?: (open: boolean) => void } = {}) => (
  <SplitButton open={false} onOpenChange={props.onOpenChange ?? (() => {})}>
    <SplitButton.Action asChild disabled={props.disabled}>
      <a href="#merge">Squash and merge</a>
    </SplitButton.Action>
    <SplitButton.Trigger aria-label="More merge options" />
    <SplitButton.Menu>
      <SplitButton.Item>Create a merge commit</SplitButton.Item>
    </SplitButton.Menu>
  </SplitButton>
);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SplitButton on the shared controller", () => {
  it("handles the action's keys in the shared controller", async () => {
    // Arrange
    const user = userEvent.setup();
    const keydown = vi.spyOn(SplitButtonController.prototype as never, "onTriggerKeydown");
    render(group());

    // Act
    await user.tab();
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(keydown).toHaveBeenCalledTimes(1);
  });

  it("asks to open once per ArrowDown under StrictMode, whose effects run twice", async () => {
    // Arrange
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const keydown = vi.spyOn(SplitButtonController.prototype as never, "onTriggerKeydown");
    render(<StrictMode>{group({ onOpenChange })}</StrictMode>);

    // Act
    await user.tab();
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(keydown).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("stops opening from an asChild action once it becomes disabled", async () => {
    // Arrange — a link has no native disabled, so only the controller can refuse.
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(group({ onOpenChange }));

    // Act
    rerender(group({ onOpenChange, disabled: true }));
    screen.getByRole("link").focus();
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("keeps opening when given refs, which still reach the consumer", async () => {
    // Arrange
    const user = userEvent.setup();
    const rootRef = createRef<HTMLDivElement>();
    const actionRef = createRef<HTMLButtonElement>();
    render(
      <SplitButton ref={rootRef}>
        <SplitButton.Action ref={actionRef}>Squash and merge</SplitButton.Action>
        <SplitButton.Trigger aria-label="More merge options" />
        <SplitButton.Menu>
          <SplitButton.Item>Create a merge commit</SplitButton.Item>
        </SplitButton.Menu>
      </SplitButton>,
    );

    // Act
    await user.tab();
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(rootRef.current).toBe(screen.getByRole("group"));
    expect(actionRef.current).toBe(screen.getByRole("button", { name: "Squash and merge" }));
    expect(screen.getByRole("group")).toHaveAttribute("data-state", "open");
  });
});
