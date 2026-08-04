import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Dropdown } from "../../Dropdown/index.ts";
import { SplitButton } from "../SplitButton";

describe("SplitButton — state modes", () => {
  it("starts open in uncontrolled mode when defaultOpen is set", () => {
    render(
      <SplitButton defaultOpen>
        <SplitButton.Action>Squash and merge</SplitButton.Action>
        <SplitButton.Trigger aria-label="More merge options" />
        <SplitButton.Menu>
          <SplitButton.Item>Rebase and merge</SplitButton.Item>
        </SplitButton.Menu>
      </SplitButton>,
    );

    expect(screen.getByRole("group")).toHaveAttribute("data-state", "open");
  });

  it("defers to the parent in controlled mode", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <SplitButton open={false} onOpenChange={onOpenChange}>
        <SplitButton.Action>Squash and merge</SplitButton.Action>
        <SplitButton.Trigger aria-label="More merge options" />
        <SplitButton.Menu>
          <SplitButton.Item>Rebase and merge</SplitButton.Item>
        </SplitButton.Menu>
      </SplitButton>,
    );

    await user.click(screen.getByRole("button", { name: "More merge options" }));

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("group")).toHaveAttribute("data-state", "closed");
  });

  it("passes the reading direction down to menus composed from Dropdown", async () => {
    const user = userEvent.setup();
    render(
      <SplitButton dir="rtl" defaultOpen>
        <SplitButton.Action>Squash and merge</SplitButton.Action>
        <SplitButton.Trigger aria-label="More merge options" />
        <SplitButton.Menu>
          <Dropdown.Sub>
            <Dropdown.SubTrigger>Merge strategies</Dropdown.SubTrigger>
            <Dropdown.SubContent>
              <SplitButton.Item>Rebase and merge</SplitButton.Item>
            </Dropdown.SubContent>
          </Dropdown.Sub>
        </SplitButton.Menu>
      </SplitButton>,
    );

    await user.keyboard("{ArrowLeft}");

    expect(
      screen.getByRole("menuitem", {
        name: "Merge strategies",
        hidden: true,
      }),
    ).toHaveAttribute("aria-expanded", "true");
  });
});
