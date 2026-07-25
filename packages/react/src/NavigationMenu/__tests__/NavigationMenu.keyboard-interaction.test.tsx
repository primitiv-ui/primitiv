import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ThreeEntryNav } from "./NavigationMenu.fixtures";

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
});
