import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Tooltip } from "../Tooltip";

// The skip-delay duration is a deliberately odd number, not a round 5000. These
// tests identify "the skip-delay timer" by the delay passed to setTimeout, and
// 5000 is common enough that other machinery in the environment schedules one too
// — which silently made a foreign timer look like ours. That is the most likely
// root cause of this file being flaky in CI while passing locally: the assertion
// pinned whichever 5000ms timer happened to be scheduled first.
const SKIP_DELAY = 4321;

describe("Tooltip.Provider — skip-delay coordination", () => {
  it("skips the delay for a tooltip while another is already open, even with a long base delay", async () => {
    const user = userEvent.setup();

    render(
      <Tooltip.Provider delayDuration={100000} skipDelayDuration={SKIP_DELAY}>
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
      <Tooltip.Provider delayDuration={0} skipDelayDuration={SKIP_DELAY}>
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
      ([, delay]) => delay === SKIP_DELAY,
    );
    const timerId = setTimeoutSpy.mock.results[skipTimerCallIndex].value;

    await user.hover(screen.getByRole("button", { name: "Hover me" }));

    expect(clearTimeoutSpy).toHaveBeenCalledWith(timerId);

    clearTimeoutSpy.mockRestore();
    setTimeoutSpy.mockRestore();
  });

  it("does not orphan a skip-delay timer when two closes land in a row", () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    render(
      <Tooltip.Provider delayDuration={0} skipDelayDuration={SKIP_DELAY}>
        <Tooltip.Root>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Content>Tooltip text</Tooltip.Content>
        </Tooltip.Root>
        <button>Other</button>
      </Tooltip.Provider>,
    );

    // `closeImmediate` is deliberately unguarded — it calls `onCloseGlobally()`
    // whether or not the tooltip is open — so two close-triggering events in a row
    // schedule two skip-delay timers. Escape and blur are both wired straight to
    // it; pointer-leave is not (it routes through `closeWithGrace`, which is why an
    // earlier version of this test using unhover only ever produced one timer).
    //
    // Driven with `fireEvent`, not `userEvent`: this asserts an exact timer count,
    // so it must not depend on how a higher-level helper chooses to synthesise
    // focus and key events — which is precisely the kind of environment
    // sensitivity that made this file flaky.
    const trigger = screen.getByRole("button", { name: "Hover me" });
    fireEvent.focus(trigger);
    fireEvent.keyDown(trigger, { key: "Escape" }); // → close #1
    fireEvent.blur(trigger); // → close #2

    const skipTimers = setTimeoutSpy.mock.calls
      .map((call, i) => ({ delay: call[1], id: setTimeoutSpy.mock.results[i].value }))
      .filter(({ delay }) => delay === SKIP_DELAY)
      .map(({ id }) => id);

    // At least two timers, asserted rather than assumed: with fewer than two the
    // loop below would pass vacuously and quietly stop testing anything. NOT an
    // exact count — an earlier version demanded exactly two and measured three,
    // because how many close events a given engine and testing helper synthesise
    // is not the property under test. The invariant is what matters, and it holds
    // for any number of closes.
    expect(skipTimers.length).toBeGreaterThanOrEqual(2);
    // Every timer but the newest must have been cancelled. Without that the ref
    // only ever tracks the latest, so the earlier one survives, fires unobserved,
    // and can no longer be cancelled by a later open.
    for (const orphan of skipTimers.slice(0, -1)) {
      expect(clearTimeoutSpy).toHaveBeenCalledWith(orphan);
    }

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
