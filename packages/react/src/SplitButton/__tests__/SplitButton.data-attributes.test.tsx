import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SplitButton } from "../SplitButton";

describe("SplitButton — data attributes", () => {
  it("reflects the menu's open state on the group", async () => {
    const user = userEvent.setup();
    render(
      <SplitButton>
        <SplitButton.Action>Squash and merge</SplitButton.Action>
        <SplitButton.Trigger aria-label="More merge options" />
        <SplitButton.Menu>
          <SplitButton.Item>Rebase and merge</SplitButton.Item>
        </SplitButton.Menu>
      </SplitButton>,
    );

    expect(screen.getByRole("group")).toHaveAttribute("data-state", "closed");

    await user.click(
      screen.getByRole("button", { name: "More merge options" }),
    );

    expect(screen.getByRole("group")).toHaveAttribute("data-state", "open");
  });
});
