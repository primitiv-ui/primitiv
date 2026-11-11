import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ToggleGroup } from "../ToggleGroup";

function Fixture({ disabledItem }: { disabledItem?: string }) {
  return (
    <ToggleGroup.Root type="single" aria-label="Alignment">
      <ToggleGroup.Item value="left" disabled={disabledItem === "left"}>
        Left
      </ToggleGroup.Item>
      <ToggleGroup.Item value="center" disabled={disabledItem === "center"}>
        Center
      </ToggleGroup.Item>
      <ToggleGroup.Item value="right" disabled={disabledItem === "right"}>
        Right
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  );
}

describe("ToggleGroup disabled item", () => {
  it("sets the native disabled attribute on the item", () => {
    render(<Fixture disabledItem="center" />);
    expect(screen.getByRole("button", { name: "Center" })).toBeDisabled();
  });

  it("never makes a disabled first item the tab stop", () => {
    render(<Fixture disabledItem="left" />);
    expect(screen.getByRole("button", { name: "Center" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("button", { name: "Left" })).toHaveAttribute("tabindex", "-1");
  });

  it('sets data-disabled="" on the disabled item', () => {
    render(<Fixture disabledItem="center" />);
    expect(screen.getByRole("button", { name: "Center" })).toHaveAttribute(
      "data-disabled",
      "",
    );
  });

  it("does not toggle the disabled item when clicked", async () => {
    const user = userEvent.setup();
    render(<Fixture disabledItem="center" />);
    await user.click(screen.getByRole("button", { name: "Center" }));
    expect(screen.getByRole("button", { name: "Center" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("skips disabled items during arrow key navigation", async () => {
    const user = userEvent.setup();
    render(<Fixture disabledItem="center" />);
    screen.getByRole("button", { name: "Left" }).focus();
    await user.keyboard("{ArrowRight}");
    // Center is skipped — focus lands on Right
    expect(screen.getByRole("button", { name: "Right" })).toHaveFocus();
  });
});
