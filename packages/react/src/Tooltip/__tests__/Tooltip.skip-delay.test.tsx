import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Tooltip } from "../Tooltip";

describe("Tooltip.Provider — skip-delay coordination", () => {
  it("skips the delay for a tooltip while another is already open, even with a long base delay", async () => {
    const user = userEvent.setup();

    render(
      <Tooltip.Provider delayDuration={100000} skipDelayDuration={5000}>
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger>First</Tooltip.Trigger>
          <Tooltip.Content>First tip</Tooltip.Content>
        </Tooltip.Root>
        <Tooltip.Root>
          <Tooltip.Trigger>Second</Tooltip.Trigger>
          <Tooltip.Content>Second tip</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    await user.hover(screen.getByRole("button", { name: "First" }));
    expect(screen.getByText("First tip")).toBeInTheDocument();

    await user.hover(screen.getByRole("button", { name: "Second" }));

    expect(screen.getByText("Second tip")).toBeInTheDocument();
  });

  it("clears a pending skip-delay timer when a tooltip opens again within the skip window", async () => {
    const user = userEvent.setup();
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    render(
      <Tooltip.Provider delayDuration={0} skipDelayDuration={5000}>
        <Tooltip.Root>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Content>Tooltip text</Tooltip.Content>
        </Tooltip.Root>
        <button>Other</button>
      </Tooltip.Provider>,
    );

    await user.tab();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await user.tab();
    expect(screen.queryByRole("tooltip")).toBeNull();

    const skipTimerCallIndex = setTimeoutSpy.mock.calls.findIndex(
      ([, delay]) => delay === 5000,
    );
    const timerId = setTimeoutSpy.mock.results[skipTimerCallIndex].value;

    await user.hover(screen.getByRole("button", { name: "Hover me" }));

    expect(clearTimeoutSpy).toHaveBeenCalledWith(timerId);

    clearTimeoutSpy.mockRestore();
    setTimeoutSpy.mockRestore();
  });

  it("schedules the skip-delay timer using the Provider's skipDelayDuration when a tooltip closes", async () => {
    const user = userEvent.setup();
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    render(
      <Tooltip.Provider skipDelayDuration={1234}>
        <Tooltip.Root>
          <Tooltip.Trigger>Focusable</Tooltip.Trigger>
          <Tooltip.Content>Tooltip text</Tooltip.Content>
        </Tooltip.Root>
        <button>Other</button>
      </Tooltip.Provider>,
    );

    await user.tab();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await user.tab();

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1234);

    setTimeoutSpy.mockRestore();
  });

  it("uses the current skipDelayDuration for the skip-delay timer after the Provider prop changes", async () => {
    const user = userEvent.setup();
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    function Wrapper({ skipDelayDuration }: { skipDelayDuration: number }) {
      return (
        <Tooltip.Provider skipDelayDuration={skipDelayDuration}>
          <Tooltip.Root>
            <Tooltip.Trigger>Focusable</Tooltip.Trigger>
            <Tooltip.Content>Tooltip text</Tooltip.Content>
          </Tooltip.Root>
          <button>Other</button>
        </Tooltip.Provider>
      );
    }

    const { rerender } = render(<Wrapper skipDelayDuration={1000} />);
    rerender(<Wrapper skipDelayDuration={42} />);

    await user.tab();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await user.tab();

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 42);

    setTimeoutSpy.mockRestore();
  });

  describe("once the skip-delay window has actually elapsed", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("re-applies the full base delay to the next tooltip instead of skipping it", () => {
      render(
        <Tooltip.Provider delayDuration={1000} skipDelayDuration={100}>
          <Tooltip.Root delayDuration={0} disableHoverableContent>
            <Tooltip.Trigger>First</Tooltip.Trigger>
            <Tooltip.Content>First tip</Tooltip.Content>
          </Tooltip.Root>
          <Tooltip.Root>
            <Tooltip.Trigger>Second</Tooltip.Trigger>
            <Tooltip.Content>Second tip</Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>,
      );

      fireEvent.pointerEnter(screen.getByRole("button", { name: "First" }));
      expect(screen.getByText("First tip")).toBeInTheDocument();

      fireEvent.pointerLeave(screen.getByRole("button", { name: "First" }));

      act(() => {
        vi.advanceTimersByTime(100);
      });

      fireEvent.pointerEnter(screen.getByRole("button", { name: "Second" }));
      expect(screen.queryByText("Second tip")).toBeNull();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText("Second tip")).toBeInTheDocument();
    });
  });
});
