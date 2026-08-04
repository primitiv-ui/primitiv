import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SplitButton } from "../SplitButton";

describe("SplitButton — basic rendering", () => {
  it("renders a group wrapping the primary action", () => {
    render(
      <SplitButton>
        <SplitButton.Action>Squash and merge</SplitButton.Action>
      </SplitButton>,
    );

    const group = screen.getByRole("group");

    expect(group).toContainElement(
      screen.getByRole("button", { name: "Squash and merge" }),
    );
  });

  it("renders the menu half as a menu button over a menu of items", () => {
    render(
      <SplitButton>
        <SplitButton.Action>Squash and merge</SplitButton.Action>
        <SplitButton.Trigger aria-label="More merge options" />
        <SplitButton.Menu>
          <SplitButton.Item>Create a merge commit</SplitButton.Item>
          <SplitButton.Separator />
          <SplitButton.Item>Rebase and merge</SplitButton.Item>
        </SplitButton.Menu>
      </SplitButton>,
    );

    const trigger = screen.getByRole("button", { name: "More merge options" });

    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute(
      "aria-controls",
      screen.getByRole("menu", { hidden: true }).id,
    );
    expect(screen.getAllByRole("menuitem", { hidden: true })).toHaveLength(2);
    expect(screen.getByRole("separator", { hidden: true })).toBeInTheDocument();
  });
});
