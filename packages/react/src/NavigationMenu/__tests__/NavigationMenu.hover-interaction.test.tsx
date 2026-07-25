import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ThreeEntryNav } from "./NavigationMenu.fixtures";

describe("NavigationMenu — hover interaction", () => {
  it("opens a panel once the delayDuration elapses on pointer enter", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav delayDuration={1} />);

    await user.hover(screen.getByRole("button", { name: "Concepts" }));

    await waitFor(() =>
      expect(screen.getByTestId("concepts-panel")).toBeVisible(),
    );
  });

  it("cancels the pending open when the pointer leaves before the delay elapses", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav delayDuration={5000} />);

    const trigger = screen.getByRole("button", { name: "Concepts" });
    await user.hover(trigger);
    await user.unhover(trigger);

    expect(screen.getByTestId("concepts-panel")).not.toBeVisible();
  });

  it("switches panels with no delay while one is already open", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav delayDuration={5000} defaultValue="concepts" />);

    await user.hover(screen.getByRole("button", { name: "Registry & CLI" }));

    expect(screen.getByTestId("registry-panel")).toBeVisible();
    expect(screen.getByTestId("concepts-panel")).not.toBeVisible();
  });

  it("keeps the panel open while the pointer moves from trigger into content", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav defaultValue="concepts" closeDelay={1} />);

    await user.hover(screen.getByRole("button", { name: "Concepts" }));
    await user.hover(screen.getByRole("link", { name: "Tokens" }));

    expect(screen.getByTestId("concepts-panel")).toBeVisible();
  });

  it("closes after the closeDelay once the pointer leaves the nav", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav defaultValue="concepts" closeDelay={1} />);

    await user.hover(screen.getByRole("button", { name: "Concepts" }));
    await user.unhover(screen.getByRole("navigation", { name: "Main" }));

    await waitFor(() =>
      expect(screen.getByTestId("concepts-panel")).not.toBeVisible(),
    );
  });

  it("forgets the pointer's arrival once it leaves, so Enter still toggles", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav delayDuration={0} closeDelay={5000} />);
    const trigger = screen.getByRole("button", { name: "Concepts" });

    await user.hover(trigger);
    await user.hover(screen.getByRole("list"));
    trigger.focus();
    await user.keyboard("{Enter}");

    // The pointer has gone, so there is no arrival state left to toggle
    // against: Enter has to read the panel that is actually open.
    expect(screen.getByTestId("concepts-panel")).not.toBeVisible();
  });

  it("ignores hover entirely when openOnHover is false", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav openOnHover={false} delayDuration={1} />);

    await user.hover(screen.getByRole("button", { name: "Concepts" }));

    expect(screen.getByTestId("concepts-panel")).not.toBeVisible();
  });

  it("leaves the panel open when a click follows the pointer's own hover-open", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav delayDuration={0} />);

    // user.click fires pointerenter first, which opens the panel; the click
    // must not read that as "already open" and undo it.
    await user.click(screen.getByRole("button", { name: "Concepts" }));

    expect(screen.getByTestId("concepts-panel")).toBeVisible();
  });

  it("closes on a second click while the trigger is still hovered", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav delayDuration={0} />);

    const trigger = screen.getByRole("button", { name: "Concepts" });
    await user.click(trigger);
    await user.click(trigger);

    expect(screen.getByTestId("concepts-panel")).not.toBeVisible();
  });
});

/** Lets real time pass so a timer that was *not* cancelled gets its chance to
 * fire. Wrapped in `act` at the call site: a state update from a timer that
 * fires outside `act` is queued rather than applied, so an unwrapped wait
 * cannot see the panel it opened. */
function waitPast(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * The timing half of hover intent, where "the timer was cancelled" has to stay
 * distinguishable from "the timer hasn't fired yet". Two techniques do that:
 *
 * - **A short delay plus a real wait several times past it.** A panel that is
 *   still closed then was cancelled, not merely outrun. The delay also has to
 *   outlast the gap before the cancelling action, or a loaded machine lets the
 *   timer win that race and the test flakes.
 * - **`delay: null` with a multi-step `user.pointer` call.** `userEvent`
 *   normally awaits a macrotask between events, which is long enough for a
 *   zero-delay timer to fire and so hides the difference between opening *now*
 *   and opening *on the next tick*. With the waits switched off, the whole
 *   pointer sequence runs before any timer gets a turn.
 *
 * Where the pointer is meant to stay inside the nav it moves to the `<ul>`
 * rather than out: leaving the `<nav>` runs `closeWithDelay`, which cancels a
 * pending open of its own and would mask what the trigger's own leave handler
 * does.
 */
describe("NavigationMenu — hover intent timing", () => {
  it("opens on a zero delay outright, so leaving straight away cannot undo it", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ThreeEntryNav delayDuration={0} />);

    await user.pointer([
      { target: screen.getByRole("button", { name: "Concepts" }) },
      { target: screen.getByRole("list") },
    ]);

    // Zero means "now": the panel is already open by the time the pointer has
    // moved off, so there is no pending open left for the leave to cancel.
    expect(screen.getByTestId("concepts-panel")).toBeVisible();
  });

  it("drops the pending open when the pointer leaves the trigger for the list", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ThreeEntryNav delayDuration={100} />);

    await user.pointer([
      { target: screen.getByRole("button", { name: "Concepts" }) },
      { target: screen.getByRole("list") },
    ]);
    await act(() => waitPast(400));

    expect(screen.getByTestId("concepts-panel")).not.toBeVisible();
  });

  it("abandons a pending open when the nav unmounts", async () => {
    const user = userEvent.setup({ delay: null });
    const onValueChange = vi.fn();
    const { unmount } = render(
      <ThreeEntryNav
        value=""
        onValueChange={onValueChange}
        delayDuration={100}
      />,
    );

    await user.hover(screen.getByRole("button", { name: "Concepts" }));
    // Nothing has opened yet, so the timer this cancels is genuinely pending.
    expect(onValueChange).not.toHaveBeenCalled();
    unmount();
    await act(() => waitPast(400));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("keeps the panel open past the closeDelay when the pointer returns", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ThreeEntryNav defaultValue="concepts" closeDelay={100} />);
    const nav = screen.getByRole("navigation", { name: "Main" });

    await user.hover(screen.getByRole("button", { name: "Concepts" }));
    await user.pointer([{ target: document.body }, { target: nav }]);
    await act(() => waitPast(400));

    // Returning has to cancel the pending close outright — not merely outrun it.
    expect(screen.getByTestId("concepts-panel")).toBeVisible();
  });

  it("honours a delayDuration changed after the first render", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ThreeEntryNav delayDuration={5000} />);

    rerender(<ThreeEntryNav delayDuration={0} />);
    await user.hover(screen.getByRole("button", { name: "Concepts" }));

    expect(screen.getByTestId("concepts-panel")).toBeVisible();
  });

  it("honours a closeDelay changed after the first render", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ThreeEntryNav defaultValue="concepts" closeDelay={5000} />,
    );

    rerender(<ThreeEntryNav defaultValue="concepts" closeDelay={20} />);
    await user.hover(screen.getByRole("button", { name: "Concepts" }));
    await user.unhover(screen.getByRole("navigation", { name: "Main" }));

    await waitFor(() =>
      expect(screen.getByTestId("concepts-panel")).not.toBeVisible(),
    );
  });

  it("requests the delayed close with the empty string", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ThreeEntryNav
        value="concepts"
        onValueChange={onValueChange}
        closeDelay={20}
      />,
    );

    await user.hover(screen.getByRole("button", { name: "Concepts" }));
    await user.unhover(screen.getByRole("navigation", { name: "Main" }));

    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith(""));
  });

  it("closes a panel the pointer left and re-entered while it was open", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav delayDuration={0} />);
    const trigger = screen.getByRole("button", { name: "Concepts" });

    await user.hover(trigger);
    await user.hover(screen.getByRole("list"));
    await user.hover(trigger);
    await user.click(trigger);

    // The second arrival sees an open panel, so the click that follows it is a
    // close — the arrival value has to be read live, not captured at mount.
    expect(screen.getByTestId("concepts-panel")).not.toBeVisible();
  });
});
