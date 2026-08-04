import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SplitButton } from "../SplitButton";

describe("SplitButton — accessibility", () => {
  it("names the menu trigger with its own text followed by the action's label", () => {
    render(
      <SplitButton>
        <SplitButton.Action>Squash and merge</SplitButton.Action>
        <SplitButton.Trigger>
          <span>More options</span>
        </SplitButton.Trigger>
        <SplitButton.Menu />
      </SplitButton>,
    );

    expect(
      screen.getByRole("button", { name: "More options Squash and merge" }),
    ).toHaveAttribute("aria-haspopup", "menu");
  });

  it("lets an explicit aria-labelledby replace the derived name", () => {
    render(
      <>
        <span id="external-label">Merge options</span>
        <SplitButton>
          <SplitButton.Action>Squash and merge</SplitButton.Action>
          <SplitButton.Trigger aria-labelledby="external-label" />
          <SplitButton.Menu />
        </SplitButton>
      </>,
    );

    expect(
      screen.getByRole("button", { name: "Merge options" }),
    ).toHaveAttribute("aria-labelledby", "external-label");
  });
});
