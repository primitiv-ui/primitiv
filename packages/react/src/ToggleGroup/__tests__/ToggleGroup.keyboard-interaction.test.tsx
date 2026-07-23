import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ToggleGroup } from "../ToggleGroup";

function SingleFixture({ defaultValue }: { defaultValue?: string }) {
  return (
    <ToggleGroup.Root type="single" defaultValue={defaultValue} aria-label="Alignment">
      <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
      <ToggleGroup.Item value="center">Center</ToggleGroup.Item>
      <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
    </ToggleGroup.Root>
  );
}

function MultipleFixture() {
  return (
    <ToggleGroup.Root type="multiple" aria-label="Formatting">
      <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
      <ToggleGroup.Item value="italic">Italic</ToggleGroup.Item>
      <ToggleGroup.Item value="underline">Underline</ToggleGroup.Item>
    </ToggleGroup.Root>
  );
}

describe("ToggleGroup keyboard — roving tabindex", () => {
  it("only one item has tabIndex=0 on mount (first item when nothing selected)", async () => {
    render(<SingleFixture />);
    // Wait for item registration effect
    await Promise.resolve();
    const buttons = screen.getAllByRole("button");
    const tabstops = buttons.filter((b) => b.getAttribute("tabindex") === "0");
    expect(tabstops).toHaveLength(1);
  });

  it("the selected item is the tabstop when defaultValue is set", async () => {
    render(<SingleFixture defaultValue="center" />);
    await Promise.resolve();
    expect(screen.getByRole("button", { name: "Center" })).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(screen.getByRole("button", { name: "Left" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });

  it("moves the tab stop to the focused item (onFocus updates the home base)", () => {
    // Arrange — nothing selected, so the first item is the initial tab stop.
    render(<SingleFixture />);
    expect(screen.getByRole("button", { name: "Left" })).toHaveAttribute(
      "tabindex",
      "0",
    );

    // Act — focusing another item should hand it the tab stop.
    fireEvent.focus(screen.getByRole("button", { name: "Right" }));

    // Assert — Right is now the sole tab stop; Left drops out of the sequence.
    expect(screen.getByRole("button", { name: "Right" })).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(screen.getByRole("button", { name: "Left" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });
});

describe("ToggleGroup keyboard — arrow key navigation (no auto-select)", () => {
  it("ArrowRight moves focus to the next item without toggling", async () => {
    const user = userEvent.setup();
    render(<SingleFixture />);
    screen.getByRole("button", { name: "Left" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Center" })).toHaveFocus();
    // Focus moved but nothing is pressed
    expect(screen.getByRole("button", { name: "Center" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("ArrowLeft moves focus to the previous item", async () => {
    const user = userEvent.setup();
    render(<SingleFixture />);
    screen.getByRole("button", { name: "Center" }).focus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("button", { name: "Left" })).toHaveFocus();
  });

  it("ArrowRight wraps from last to first", async () => {
    const user = userEvent.setup();
    render(<SingleFixture />);
    screen.getByRole("button", { name: "Right" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Left" })).toHaveFocus();
  });

  it("Home moves focus to the first item", async () => {
    const user = userEvent.setup();
    render(<SingleFixture />);
    screen.getByRole("button", { name: "Right" }).focus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("button", { name: "Left" })).toHaveFocus();
  });

  it("End moves focus to the last item", async () => {
    const user = userEvent.setup();
    render(<SingleFixture />);
    screen.getByRole("button", { name: "Left" }).focus();
    await user.keyboard("{End}");
    expect(screen.getByRole("button", { name: "Right" })).toHaveFocus();
  });
});

describe("ToggleGroup keyboard — Space/Enter activate focused item", () => {
  it("Space toggles the focused item on", async () => {
    const user = userEvent.setup();
    render(<SingleFixture />);
    screen.getByRole("button", { name: "Center" }).focus();
    await user.keyboard(" ");
    expect(screen.getByRole("button", { name: "Center" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("Space toggles the focused active item off (single mode deselect)", async () => {
    const user = userEvent.setup();
    render(<SingleFixture defaultValue="center" />);
    screen.getByRole("button", { name: "Center" }).focus();
    await user.keyboard(" ");
    expect(screen.getByRole("button", { name: "Center" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("Enter toggles the focused item on (multiple mode)", async () => {
    const user = userEvent.setup();
    render(<MultipleFixture />);
    screen.getByRole("button", { name: "Bold" }).focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // Others unaffected
    expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("navigating then activating toggles the destination item", async () => {
    const user = userEvent.setup();
    render(<SingleFixture />);
    screen.getByRole("button", { name: "Left" }).focus();
    await user.keyboard("{ArrowRight}");
    await user.keyboard(" ");
    expect(screen.getByRole("button", { name: "Center" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Left" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
