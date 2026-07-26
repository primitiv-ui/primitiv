import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { ThreeEntryNav } from "./NavigationMenu.fixtures";

describe("NavigationMenu — controlled state", () => {
  it("reflects the value prop without owning it", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ThreeEntryNav value="" onValueChange={onValueChange} />);

    await user.click(screen.getByRole("button", { name: "Concepts" }));

    expect(onValueChange).toHaveBeenCalledWith("concepts");
    expect(screen.getByTestId("concepts-panel")).not.toBeVisible();
  });

  it("requests a close with the empty string", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ThreeEntryNav value="concepts" onValueChange={onValueChange} />);

    await user.click(screen.getByRole("button", { name: "Concepts" }));

    expect(onValueChange).toHaveBeenCalledWith("");
  });

  it("requests the close with the empty string on Escape", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ThreeEntryNav value="concepts" onValueChange={onValueChange} />);

    screen.getByRole("link", { name: "Tokens" }).focus();
    await user.keyboard("{Escape}");

    expect(onValueChange).toHaveBeenCalledWith("");
  });

  it("reports nothing when Escape is pressed with every panel closed", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ThreeEntryNav value="" onValueChange={onValueChange} />);

    screen.getByRole("link", { name: "Changelog" }).focus();
    await user.keyboard("{Escape}");

    // Nothing is open, so there is nothing to close — a spurious `""` would
    // make a controlled parent re-render (and clear its own state) on every
    // stray Escape anywhere in the nav.
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("still closes when the open value names no rendered trigger", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ThreeEntryNav value="ghost" onValueChange={onValueChange} />);

    screen.getByRole("link", { name: "Changelog" }).focus();
    await user.keyboard("{Escape}");

    // There is no trigger to return focus to, which must not stop the close.
    expect(onValueChange).toHaveBeenCalledWith("");
  });

  it("calls the latest onValueChange, not the one from first render", async () => {
    const user = userEvent.setup();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(
      <ThreeEntryNav value="concepts" onValueChange={first} />,
    );

    rerender(<ThreeEntryNav value="concepts" onValueChange={second} />);
    screen.getByRole("link", { name: "Tokens" }).focus();
    await user.keyboard("{Escape}");

    // An inline `onValueChange` is a new function every render, so a handler
    // pinned at mount would report to a closure over stale parent state.
    expect(second).toHaveBeenCalledWith("");
    expect(first).not.toHaveBeenCalled();
  });

  it("reports nothing when focus moves outside with everything already closed", () => {
    const onValueChange = vi.fn();
    render(<ThreeEntryNav value="" onValueChange={onValueChange} />);

    const trigger = screen.getByRole("button", { name: "Concepts" });
    fireEvent.blur(trigger, { relatedTarget: document.body });

    // A spurious "" would make a controlled parent re-render on every stray
    // blur inside the nav, exactly like the Escape case above.
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("requests a close with the empty string when focus moves outside", () => {
    const onValueChange = vi.fn();
    render(<ThreeEntryNav value="concepts" onValueChange={onValueChange} />);

    const trigger = screen.getByRole("button", { name: "Concepts" });
    fireEvent.blur(trigger, { relatedTarget: document.body });

    expect(onValueChange).toHaveBeenCalledWith("");
  });

  it("calls the latest onValueChange on a focus-outside close too, not the one from first render", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(
      <ThreeEntryNav value="concepts" onValueChange={first} />,
    );

    rerender(<ThreeEntryNav value="concepts" onValueChange={second} />);
    const trigger = screen.getByRole("button", { name: "Concepts" });
    fireEvent.blur(trigger, { relatedTarget: document.body });

    expect(second).toHaveBeenCalledWith("");
    expect(first).not.toHaveBeenCalled();
  });

  it("opens the panel once the parent commits the new value", async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [open, setOpen] = useState("");
      return <ThreeEntryNav value={open} onValueChange={setOpen} />;
    }

    render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "Registry & CLI" }));

    expect(screen.getByTestId("registry-panel")).toBeVisible();
  });
});
