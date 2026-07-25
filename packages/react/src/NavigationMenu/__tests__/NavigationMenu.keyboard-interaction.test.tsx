import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DeadEndNav, ThreeEntryNav } from "./NavigationMenu.fixtures";

describe("NavigationMenu — keyboard interaction", () => {
  it("toggles a panel with Enter on its trigger", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav />);

    screen.getByRole("button", { name: "Concepts" }).focus();
    await user.keyboard("{Enter}");

    expect(screen.getByTestId("concepts-panel")).toBeVisible();

    await user.keyboard("{Enter}");

    expect(screen.getByTestId("concepts-panel")).not.toBeVisible();
  });

  it("toggles a panel with Space on its trigger", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav />);

    screen.getByRole("button", { name: "Concepts" }).focus();
    await user.keyboard(" ");

    expect(screen.getByTestId("concepts-panel")).toBeVisible();
  });

  it("opens the panel and moves focus into it on ArrowDown when horizontal", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav />);

    screen.getByRole("button", { name: "Concepts" }).focus();
    await user.keyboard("{ArrowDown}");

    expect(screen.getByTestId("concepts-panel")).toBeVisible();
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Tokens" })).toHaveFocus(),
    );
  });

  it("moves focus into an already-open panel on ArrowDown", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav defaultValue="concepts" />);

    screen.getByRole("button", { name: "Concepts" }).focus();
    await user.keyboard("{ArrowDown}");

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Tokens" })).toHaveFocus(),
    );
  });

  it("uses ArrowRight to enter the panel when vertical", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav orientation="vertical" />);

    screen.getByRole("button", { name: "Concepts" }).focus();
    await user.keyboard("{ArrowRight}");

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Tokens" })).toHaveFocus(),
    );
  });

  it("uses ArrowLeft to enter the panel when vertical and rtl", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav orientation="vertical" dir="rtl" />);

    screen.getByRole("button", { name: "Concepts" }).focus();
    await user.keyboard("{ArrowLeft}");

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Tokens" })).toHaveFocus(),
    );
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav defaultValue="concepts" />);

    screen.getByRole("link", { name: "Tokens" }).focus();
    await user.keyboard("{Escape}");

    expect(screen.getByTestId("concepts-panel")).not.toBeVisible();
    expect(screen.getByRole("button", { name: "Concepts" })).toHaveFocus();
  });

  it("leaves focus alone when Escape is pressed with nothing open", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav />);

    const changelog = screen.getByRole("link", { name: "Changelog" });
    changelog.focus();
    await user.keyboard("{Escape}");

    expect(changelog).toHaveFocus();
  });

  it("does nothing on an unhandled key", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav defaultValue="concepts" />);

    const trigger = screen.getByRole("button", { name: "Concepts" });
    trigger.focus();
    await user.keyboard("a");

    expect(trigger).toHaveFocus();
    expect(screen.getByTestId("concepts-panel")).toBeVisible();
  });

  it("ignores the enter-panel key on an entry with no panel", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav />);

    const changelog = screen.getByRole("link", { name: "Changelog" });
    changelog.focus();
    await user.keyboard("{ArrowDown}");

    expect(changelog).toHaveFocus();
  });

  it("moves focus into a panel it opened by click, on the enter-panel arrow", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav />);

    await user.click(screen.getByRole("button", { name: "Concepts" }));
    await user.keyboard("{ArrowDown}");

    // The panel is open by the time the arrow lands, so the arrow has to read
    // the live open state — an open value captured at mount takes the wrong
    // branch and never focuses anything.
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Tokens" })).toHaveFocus(),
    );
  });

  it("leaves Home and End to the browser inside an open panel", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav defaultValue="concepts" />);

    const tokens = screen.getByRole("link", { name: "Tokens" });
    tokens.focus();
    await user.keyboard("{Home}");

    // A panel link is reached by Tab, not by the top-level order — so Home must
    // not jump out of the panel onto the first trigger.
    expect(tokens).toHaveFocus();
  });
});

/**
 * Focus only enters a panel when the enter-panel arrow asked for it. The
 * mechanism is a pending flag spent by an effect, and every way of opening a
 * panel runs that effect — so each of these proves an open that *didn't* come
 * from the arrow leaves focus where the user put it.
 */
describe("NavigationMenu — unsolicited panel focus", () => {
  it("does not move focus into a panel opened by defaultValue", () => {
    render(<ThreeEntryNav defaultValue="concepts" />);

    expect(screen.getByTestId("concepts-panel")).toBeVisible();
    expect(document.body).toHaveFocus();
  });

  it("keeps focus on the trigger when a click opens the panel", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav />);

    const trigger = screen.getByRole("button", { name: "Concepts" });
    await user.click(trigger);

    expect(screen.getByTestId("concepts-panel")).toBeVisible();
    expect(trigger).toHaveFocus();
  });

  it("does not replay the arrow's intent on the next open", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav />);

    const trigger = screen.getByRole("button", { name: "Concepts" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Tokens" })).toHaveFocus(),
    );
    await user.keyboard("{Escape}");
    await user.click(trigger);

    // The arrow's intent was spent on the first open; a second open by click
    // must not inherit it.
    expect(trigger).toHaveFocus();
  });

  it("does not replay the intent after entering an already-open panel", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav defaultValue="concepts" />);

    const trigger = screen.getByRole("button", { name: "Concepts" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Tokens" })).toHaveFocus(),
    );
    await user.keyboard("{Escape}");
    await user.click(trigger);

    expect(trigger).toHaveFocus();
  });
});

describe("NavigationMenu — enter-panel arrow with nothing to focus", () => {
  it("opens an entry that has no panel at all", async () => {
    const user = userEvent.setup();
    render(<DeadEndNav />);

    const trigger = screen.getByRole("button", { name: "Panelless" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveFocus();
  });

  it("survives the arrow on an already-open entry with no panel", async () => {
    const user = userEvent.setup();
    render(<DeadEndNav defaultValue="panelless" />);

    const trigger = screen.getByRole("button", { name: "Panelless" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");

    expect(trigger).toHaveFocus();
  });

  it("opens a panel that holds nothing focusable", async () => {
    const user = userEvent.setup();
    render(<DeadEndNav />);

    const trigger = screen.getByRole("button", { name: "Prose" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");

    expect(screen.getByTestId("prose-panel")).toBeVisible();
    expect(trigger).toHaveFocus();
  });

  it("survives the arrow on an already-open panel with nothing focusable", async () => {
    const user = userEvent.setup();
    render(<DeadEndNav defaultValue="prose" />);

    const trigger = screen.getByRole("button", { name: "Prose" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");

    expect(trigger).toHaveFocus();
  });
});
