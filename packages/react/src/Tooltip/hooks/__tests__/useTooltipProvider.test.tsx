import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useTooltipProvider } from "../useTooltipProvider";

/**
 * `useTooltipProvider` schedules its skip-delay reset with a raw
 * `setTimeout`, so it is exercised here directly rather than through the
 * full `Tooltip.Provider` tree — the defect under test (a timer surviving
 * unmount) has no user-facing render output to assert on.
 */
function Probe() {
  const { contextValue } = useTooltipProvider({
    delayDuration: 0,
    skipDelayDuration: 300,
  });
  return <button onClick={contextValue.onCloseGlobally}>close</button>;
}

describe("useTooltipProvider — timer cleanup", () => {
  it("clears the pending skip-delay timeout on unmount instead of letting it fire later", async () => {
    const user = userEvent.setup();
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    const { unmount } = render(<Probe />);
    await user.click(screen.getByRole("button", { name: "close" }));

    // setTimeoutSpy also captures unrelated timers (userEvent's own
    // scheduling, React internals) — find the one this hook scheduled with
    // its 300ms skipDelayDuration.
    const callIndex = setTimeoutSpy.mock.calls.findIndex(
      ([, delay]) => delay === 300,
    );
    const timerId = setTimeoutSpy.mock.results[callIndex].value;
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalledWith(timerId);
  });
});
