import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode, createRef, type ReactElement } from "react";

import { ToggleGroup } from "../ToggleGroup";

// ToggleGroup's DOM behaviour runs in the shared ToggleGroupController from
// @primitiv-ui/web (RFC 0033 §3.4). These cover what hosting it adds: one
// controller per root under StrictMode, the root's ref still reaching the
// consumer, and a consumer onKeyDown running beside the keyboard contract.

function items(onKeyDown?: () => void): ReactElement[] {
  return ["left", "right"].map((value) => (
    <ToggleGroup.Item key={value} value={value} onKeyDown={onKeyDown}>
      {value}
    </ToggleGroup.Item>
  ));
}

describe("ToggleGroup on the shared controller", () => {
  it("toggles once per click under StrictMode, whose effects run twice", async () => {
    // Arrange
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StrictMode>
        <ToggleGroup.Root type="multiple" value={[]} onValueChange={onValueChange}>
          {items()}
        </ToggleGroup.Root>
      </StrictMode>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "left" }));

    // Assert
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(["left"]);
  });

  it("keeps toggling and moving focus when the root is given a ref, which still reaches the consumer", async () => {
    // Arrange
    const user = userEvent.setup();
    const ref = createRef<HTMLDivElement>();
    render(
      <ToggleGroup.Root type="single" ref={ref}>
        {items()}
      </ToggleGroup.Root>,
    );
    screen.getByRole("button", { name: "left" }).focus();

    // Act
    await user.keyboard("{ArrowRight}{Enter}");

    // Assert
    expect(ref.current?.getAttribute("role")).toBe("group");
    expect(screen.getByRole("button", { name: "right" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "right" })).toHaveAttribute("aria-pressed", "true");
  });

  it("runs a consumer onKeyDown beside the keyboard contract, rather than in place of it", async () => {
    // Arrange
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(<ToggleGroup.Root type="multiple">{items(onKeyDown)}</ToggleGroup.Root>);
    screen.getByRole("button", { name: "left" }).focus();

    // Act
    await user.keyboard("{Enter}{ArrowRight}");

    // Assert
    expect(onKeyDown).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "left" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "right" })).toHaveFocus();
  });

  it("reports a single-mode deselection as undefined", async () => {
    // Arrange
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ToggleGroup.Root type="single" value="left" onValueChange={onValueChange}>
        {items()}
      </ToggleGroup.Root>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "left" }));

    // Assert
    expect(onValueChange).toHaveBeenCalledWith(undefined);
  });
});
