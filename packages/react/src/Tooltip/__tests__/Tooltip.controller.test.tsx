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

  it("marks the side its content landed on against the trigger, for a stylesheet's arrow", () => {
    // Arrange — jsdom lays nothing out: the content sits above the trigger.
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const [left, top, width, height] = this.getAttribute("role") === "tooltip" ? [80, 40, 100, 50] : [100, 100, 60, 20];
      return { left, top, right: left + width, bottom: top + height } as DOMRect;
    });

    // Act
    render(
      <Tooltip.Provider>
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Content>Tip</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    // Assert
    expect(screen.getByRole("tooltip").getAttribute("data-side")).toBe("top");
    vi.restoreAllMocks();
  });

  it("keeps a consumer's ref on the trigger", () => {
    // Arrange
    const ref = { current: null as HTMLButtonElement | null };

    // Act
    render(
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger ref={ref}>Hover me</Tooltip.Trigger>
          <Tooltip.Content>Tip</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    // Assert
    expect(ref.current).toBe(screen.getByRole("button", { name: "Hover me" }));
  });
});
