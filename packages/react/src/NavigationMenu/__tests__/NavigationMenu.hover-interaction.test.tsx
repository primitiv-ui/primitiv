import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("cancels the pending close when the pointer returns to the nav", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav defaultValue="concepts" closeDelay={5000} />);

    const nav = screen.getByRole("navigation", { name: "Main" });
    await user.unhover(nav);
    await user.hover(nav);

    expect(screen.getByTestId("concepts-panel")).toBeVisible();
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

/**
 * The timing half of hover intent. Real timers can't tell "the open timer was
 * cancelled" from "the open timer hasn't fired yet", so these drive the clock
 * directly — and with it, `fireEvent` rather than `userEvent`.
 *
 * `pointerOut` carries an explicit `relatedTarget` inside the nav where the
 * pointer is meant to stay in the nav: leaving the `<nav>` runs
 * `closeWithDelay`, which cancels any pending open of its own and would mask
 * what the trigger's own leave handler does.
 */
describe("NavigationMenu — hover intent timing", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens synchronously, scheduling nothing, when delayDuration is zero", () => {
    render(<ThreeEntryNav delayDuration={0} />);

    fireEvent.pointerOver(screen.getByRole("button", { name: "Concepts" }));

    // No clock advance: zero means "now", not "on the next tick".
    expect(screen.getByTestId("concepts-panel")).toBeVisible();
  });

  it("drops the pending open when the pointer leaves the trigger for the list", () => {
    render(<ThreeEntryNav delayDuration={200} />);
    const trigger = screen.getByRole("button", { name: "Concepts" });

    fireEvent.pointerOver(trigger);
    fireEvent.pointerOut(trigger, { relatedTarget: screen.getByRole("list") });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByTestId("concepts-panel")).not.toBeVisible();
  });

  it("abandons a pending open when the nav unmounts", () => {
    const onValueChange = vi.fn();
    const { unmount } = render(
      <ThreeEntryNav value="" onValueChange={onValueChange} delayDuration={200} />,
    );

    fireEvent.pointerOver(screen.getByRole("button", { name: "Concepts" }));
    unmount();
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("honours a delayDuration changed after the first render", () => {
    const { rerender } = render(<ThreeEntryNav delayDuration={5000} />);

    rerender(<ThreeEntryNav delayDuration={0} />);
    fireEvent.pointerOver(screen.getByRole("button", { name: "Concepts" }));

    expect(screen.getByTestId("concepts-panel")).toBeVisible();
  });

  it("honours a closeDelay changed after the first render", () => {
    const { rerender } = render(
      <ThreeEntryNav defaultValue="concepts" closeDelay={5000} />,
    );

    rerender(<ThreeEntryNav defaultValue="concepts" closeDelay={0} />);
    fireEvent.pointerOut(screen.getByRole("navigation", { name: "Main" }), {
      relatedTarget: document.body,
    });
    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.getByTestId("concepts-panel")).not.toBeVisible();
  });

  it("requests the delayed close with the empty string", () => {
    const onValueChange = vi.fn();
    render(
      <ThreeEntryNav
        value="concepts"
        onValueChange={onValueChange}
        closeDelay={150}
      />,
    );

    fireEvent.pointerOut(screen.getByRole("navigation", { name: "Main" }), {
      relatedTarget: document.body,
    });
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(onValueChange).toHaveBeenCalledWith("");
  });

  it("closes a panel the pointer left and re-entered while it was open", () => {
    render(<ThreeEntryNav delayDuration={0} />);
    const trigger = screen.getByRole("button", { name: "Concepts" });
    const list = screen.getByRole("list");

    fireEvent.pointerOver(trigger);
    fireEvent.pointerOut(trigger, { relatedTarget: list });
    fireEvent.pointerOver(trigger, { relatedTarget: list });
    fireEvent.click(trigger);

    // The second arrival sees an open panel, so the click that follows it is a
    // close — the arrival value has to be read live, not captured at mount.
    expect(screen.getByTestId("concepts-panel")).not.toBeVisible();
  });
});
