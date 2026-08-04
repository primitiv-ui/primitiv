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
});
