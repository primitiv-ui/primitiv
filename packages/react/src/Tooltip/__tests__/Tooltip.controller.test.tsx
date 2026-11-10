import { fireEvent, render, screen } from "@testing-library/react";

import { Tooltip } from "../Tooltip";

// Hover intent runs in the shared TooltipController from @primitiv-ui/web
// (RFC 0033 §3.4). This covers what hosting it adds: the controller's timers
// are cancelled when the tooltip unmounts.

describe("Tooltip on the shared controller", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("cancels a pending hover open when it unmounts", () => {
    // Arrange
    const onOpenChange = vi.fn();
    const { unmount } = render(
      <Tooltip.Provider delayDuration={500}>
        <Tooltip.Root onOpenChange={onOpenChange}>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Content>Tip</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Hover me" }));

    // Act
    unmount();
    vi.advanceTimersByTime(1000);

    // Assert
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
