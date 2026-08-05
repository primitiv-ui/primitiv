import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SplitButton } from "../SplitButton";

describe("SplitButton — disabled", () => {
  it("disables both halves when the group is disabled", () => {
    render(
      <SplitButton disabled>
        <SplitButton.Action>Squash and merge</SplitButton.Action>
        <SplitButton.Trigger aria-label="More merge options" />
        <SplitButton.Menu />
      </SplitButton>,
    );

    expect(screen.getByRole("group")).toHaveAttribute("data-disabled", "");
    expect(
      screen.getByRole("button", { name: "Squash and merge" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "More merge options" }),
    ).toBeDisabled();
  });

  it("disables one half independently, leaving the other interactive", () => {
    render(
      <SplitButton>
        <SplitButton.Action disabled>Squash and merge</SplitButton.Action>
        <SplitButton.Trigger aria-label="More merge options" />
        <SplitButton.Menu />
      </SplitButton>,
    );

    expect(screen.getByRole("group")).not.toHaveAttribute("data-disabled");
    expect(
      screen.getByRole("button", { name: "Squash and merge" }),
    ).toHaveAttribute("data-disabled", "");
    expect(
      screen.getByRole("button", { name: "More merge options" }),
    ).toBeEnabled();
  });

  it("disables only the menu half when the trigger is disabled", () => {
    render(
      <SplitButton>
        <SplitButton.Action>Squash and merge</SplitButton.Action>
        <SplitButton.Trigger disabled aria-label="More merge options" />
        <SplitButton.Menu />
      </SplitButton>,
    );

    expect(
      screen.getByRole("button", { name: "Squash and merge" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "More merge options" }),
    ).toHaveAttribute("data-disabled", "");
  });

  it("re-propagates when the group's disabled flips after mount", () => {
    const markup = (disabled: boolean) => (
      <SplitButton disabled={disabled}>
        <SplitButton.Action>Squash and merge</SplitButton.Action>
        <SplitButton.Trigger aria-label="More merge options" />
        <SplitButton.Menu />
      </SplitButton>
    );
    const { rerender } = render(markup(false));

    rerender(markup(true));

    expect(
      screen.getByRole("button", { name: "Squash and merge" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "More merge options" }),
    ).toBeDisabled();
  });
});
