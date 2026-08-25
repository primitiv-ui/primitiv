import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Tooltip } from "../Tooltip";

describe("Tooltip.Root — timer callbacks stay current across re-renders", () => {
  it("uses the current onOpenChange for both a focus-open and a blur-close after the Provider re-renders", async () => {
    const user = userEvent.setup();
    const firstOnOpenChange = vi.fn();
    const secondOnOpenChange = vi.fn();

    function Wrapper({
      onOpenChange,
    }: {
      onOpenChange: (open: boolean) => void;
    }) {
      return (
        <Tooltip.Provider>
          <Tooltip.Root onOpenChange={onOpenChange}>
            <Tooltip.Trigger>Focusable</Tooltip.Trigger>
            <Tooltip.Content>Tooltip text</Tooltip.Content>
          </Tooltip.Root>
          <button>Other</button>
        </Tooltip.Provider>
      );
    }

    const { rerender } = render(<Wrapper onOpenChange={firstOnOpenChange} />);
    rerender(<Wrapper onOpenChange={secondOnOpenChange} />);

    await user.tab();
    await user.tab();

    expect(firstOnOpenChange).not.toHaveBeenCalled();
    expect(secondOnOpenChange).toHaveBeenCalledWith(true);
    expect(secondOnOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("Tooltip.Root — timer coordination (fake timers)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens synchronously when the effective delay is 0, not via a scheduled timer", () => {
    render(
      <Tooltip.Provider delayDuration={0}>
        <Tooltip.Root>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Content>Tooltip text</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    fireEvent.pointerEnter(screen.getByRole("button", { name: "Hover me" }));

    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("cancels a pending hover-delay open timer when the trigger is focused before it elapses", () => {
    const onOpenChange = vi.fn();

    render(
      <Tooltip.Provider delayDuration={1000}>
        <Tooltip.Root onOpenChange={onOpenChange}>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Content>Tooltip text</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    fireEvent.pointerEnter(screen.getByRole("button", { name: "Hover me" }));
    fireEvent.focus(screen.getByRole("button", { name: "Hover me" }));

    expect(onOpenChange).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it("cancels a pending grace-period timer when the tooltip closes immediately during the grace window", () => {
    const onOpenChange = vi.fn();

    // No Tooltip.Content here: its document-level Escape listener would also
    // fire and call closeImmediate a second time, muddying the call count
    // this test cares about. The trigger's own Escape handler is enough to
    // exercise closeImmediate while a grace-period timer is pending.
    render(
      <Tooltip.Provider delayDuration={0}>
        <Tooltip.Root onOpenChange={onOpenChange}>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    fireEvent.pointerEnter(screen.getByRole("button", { name: "Hover me" }));
    expect(onOpenChange).toHaveBeenCalledTimes(1);

    // Leaving the trigger starts the grace-period close timer...
    fireEvent.pointerLeave(screen.getByRole("button", { name: "Hover me" }));
    // ...then Escape closes immediately, which must cancel that pending timer.
    fireEvent.keyDown(screen.getByRole("button", { name: "Hover me" }), {
      key: "Escape",
    });

    expect(onOpenChange).toHaveBeenCalledTimes(2);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  it("cancels the grace-period close timer when the pointer moves into the content", () => {
    render(
      <Tooltip.Provider delayDuration={0}>
        <Tooltip.Root>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Content>Tooltip text</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    fireEvent.pointerEnter(screen.getByRole("button", { name: "Hover me" }));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.pointerLeave(screen.getByRole("button", { name: "Hover me" }));
    fireEvent.pointerEnter(screen.getByRole("tooltip"));

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("closes after the grace period once the pointer leaves the trigger without re-entering the content", () => {
    render(
      <Tooltip.Provider delayDuration={0}>
        <Tooltip.Root>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Content>Tooltip text</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    fireEvent.pointerEnter(screen.getByRole("button", { name: "Hover me" }));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.pointerLeave(screen.getByRole("button", { name: "Hover me" }));

    // Still open right up until the grace period elapses.
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("cancels a pending hover-delay open timer when the pointer leaves before it elapses, so the tooltip does not open later", () => {
    render(
      <Tooltip.Provider delayDuration={500}>
        <Tooltip.Root>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Content>Tooltip text</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    fireEvent.pointerEnter(screen.getByRole("button", { name: "Hover me" }));
    fireEvent.pointerLeave(screen.getByRole("button", { name: "Hover me" }));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("uses the current onOpenChange callback for a grace-period close after a re-render", () => {
    const firstOnOpenChange = vi.fn();
    const secondOnOpenChange = vi.fn();

    function Wrapper({
      onOpenChange,
    }: {
      onOpenChange: (open: boolean) => void;
    }) {
      return (
        <Tooltip.Provider delayDuration={0}>
          <Tooltip.Root onOpenChange={onOpenChange}>
            <Tooltip.Trigger>Hover me</Tooltip.Trigger>
            <Tooltip.Content>Tooltip text</Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      );
    }

    const { rerender } = render(<Wrapper onOpenChange={firstOnOpenChange} />);
    rerender(<Wrapper onOpenChange={secondOnOpenChange} />);

    fireEvent.pointerEnter(screen.getByRole("button", { name: "Hover me" }));
    fireEvent.pointerLeave(screen.getByRole("button", { name: "Hover me" }));

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(firstOnOpenChange).not.toHaveBeenCalled();
    expect(secondOnOpenChange).toHaveBeenCalledWith(true);
    expect(secondOnOpenChange).toHaveBeenCalledWith(false);
  });
});
