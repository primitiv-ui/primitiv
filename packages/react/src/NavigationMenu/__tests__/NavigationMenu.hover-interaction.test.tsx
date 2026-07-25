import { render, screen, waitFor } from "@testing-library/react";
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

  it("opens immediately when delayDuration is zero", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav delayDuration={0} />);

    await user.hover(screen.getByRole("button", { name: "Concepts" }));

    expect(screen.getByTestId("concepts-panel")).toBeVisible();
  });
});
