import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SplitButton } from "../SplitButton";

describe("SplitButton — keyboard interaction", () => {
  it("opens the menu from the action with ArrowDown and focuses the first item", async () => {
    const user = userEvent.setup();
    render(
      <SplitButton>
        <SplitButton.Action>Squash and merge</SplitButton.Action>
        <SplitButton.Trigger aria-label="More merge options" />
        <SplitButton.Menu>
          <SplitButton.Item>Create a merge commit</SplitButton.Item>
          <SplitButton.Item>Rebase and merge</SplitButton.Item>
        </SplitButton.Menu>
      </SplitButton>,
    );

    await user.tab();
    await user.keyboard("{ArrowDown}");

    expect(
      screen.getByRole("button", { name: "More merge options" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("menuitem", {
        name: "Create a merge commit",
        hidden: true,
      }),
    ).toHaveFocus();
  });

  it("leaves the menu closed for other keys, and still runs the action's own handler", async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(
      <SplitButton>
        <SplitButton.Action onKeyDown={onKeyDown}>
          Squash and merge
        </SplitButton.Action>
        <SplitButton.Trigger aria-label="More merge options" />
        <SplitButton.Menu>
          <SplitButton.Item>Create a merge commit</SplitButton.Item>
        </SplitButton.Menu>
      </SplitButton>,
    );

    await user.tab();
    await user.keyboard("{ArrowUp}");

    expect(onKeyDown).toHaveBeenCalledOnce();
    expect(screen.getByRole("group")).toHaveAttribute("data-state", "closed");
  });
});
