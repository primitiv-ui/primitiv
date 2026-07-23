import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ToggleGroup } from "../ToggleGroup";

function ItemsFixture({ items }: { items: string[] }) {
  return (
    <ToggleGroup.Root type="single" aria-label="Alignment">
      {items.map((v) => (
        <ToggleGroup.Item key={v} value={v}>
          {v}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}

function DisabledFixture({ disabledItem }: { disabledItem?: string }) {
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

describe("ToggleGroup dynamic items — registration lifecycle", () => {
  it("unregisters an unmounted item so the tab stop moves to the survivor", () => {
    // Arrange — "a" is the first enabled item, so it holds the tab stop.
    const { rerender } = render(<ItemsFixture items={["a", "b"]} />);
    expect(screen.getByRole("button", { name: "a" })).toHaveAttribute(
      "tabindex",
      "0",
    );

    // Act — remove "a"; its effect cleanup must unregister it.
    rerender(<ItemsFixture items={["b"]} />);

    // Assert — with "a" gone from the registry, "b" is now the tab stop. A
    // no-op cleanup would leave "a" registered ahead of "b", stranding the
    // tab stop on the detached element and leaving "b" at tabindex -1.
    expect(screen.getByRole("button", { name: "b" })).toHaveAttribute(
      "tabindex",
      "0",
    );
  });

  it("re-registers an item's disabled flag when it changes after mount", async () => {
    // Arrange — all three enabled; focus can travel Left → Center → Right.
    const user = userEvent.setup();
    const { rerender } = render(<DisabledFixture />);

    // Act — disable Center after mount, then navigate rightward from Left.
    rerender(<DisabledFixture disabledItem="center" />);
    screen.getByRole("button", { name: "Left" }).focus();
    await user.keyboard("{ArrowRight}");

    // Assert — the registrar effect re-ran, so Center is skipped and focus
    // lands on Right. A stale registration would keep Center navigable and
    // strand focus (a disabled button cannot receive it).
    expect(screen.getByRole("button", { name: "Right" })).toHaveFocus();
  });
});
