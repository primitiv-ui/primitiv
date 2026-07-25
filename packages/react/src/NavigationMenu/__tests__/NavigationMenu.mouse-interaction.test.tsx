import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ThreeEntryNav } from "./NavigationMenu.fixtures";

describe("NavigationMenu — mouse interaction", () => {
  it("opens a panel on trigger click and closes it on a second click", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav />);

    const trigger = screen.getByRole("button", { name: "Concepts" });
    const panel = screen.getByTestId("concepts-panel");

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("data-state", "open");
    expect(panel).toHaveAttribute("data-state", "open");
    expect(panel).toBeVisible();

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(panel).not.toBeVisible();
  });

  it("switches the open panel when a different trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav />);

    await user.click(screen.getByRole("button", { name: "Concepts" }));
    await user.click(screen.getByRole("button", { name: "Registry & CLI" }));

    expect(screen.getByTestId("concepts-panel")).not.toBeVisible();
    expect(screen.getByTestId("registry-panel")).toBeVisible();
  });
});
