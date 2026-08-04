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
});
