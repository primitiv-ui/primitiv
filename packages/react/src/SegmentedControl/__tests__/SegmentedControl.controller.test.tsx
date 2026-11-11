import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode, createRef, type ReactElement } from "react";

import { SegmentedControl } from "../SegmentedControl";

// SegmentedControl's DOM behaviour runs in the shared SegmentedControlController
// from @primitiv-ui/web (RFC 0033 §3.4). These cover what hosting it adds: one
// controller per root under StrictMode, the root's ref still reaching the
// consumer, and consumer handlers running beside the keyboard contract.

function items(handlers: { onKeyDown?: () => void; onClick?: () => void } = {}): ReactElement[] {
  return ["day", "week"].map((value) => (
    <SegmentedControl.Item key={value} value={value} {...handlers}>
      {value}
    </SegmentedControl.Item>
  ));
}

describe("SegmentedControl on the shared controller", () => {
  it("selects once per click under StrictMode, whose effects run twice", async () => {
    // Arrange
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StrictMode>
        <SegmentedControl.Root value="day" onValueChange={onValueChange} aria-label="Range">
          {items()}
        </SegmentedControl.Root>
      </StrictMode>,
    );

    // Act
    await user.click(screen.getByRole("radio", { name: "week" }));

    // Assert
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("week");
  });

  it("keeps selecting with the arrows when the root is given a ref, which still reaches the consumer", async () => {
    // Arrange
    const user = userEvent.setup();
    const ref = createRef<HTMLDivElement>();
    render(
      <SegmentedControl.Root defaultValue="day" ref={ref} aria-label="Range">
        {items()}
      </SegmentedControl.Root>,
    );
    screen.getByRole("radio", { name: "day" }).focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(ref.current?.getAttribute("role")).toBe("radiogroup");
    expect(screen.getByRole("radio", { name: "week" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "week" })).toHaveAttribute("aria-checked", "true");
  });

  it("runs a consumer's onKeyDown and onClick beside the controller", async () => {
    // Arrange
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    const onClick = vi.fn();
    render(
      <SegmentedControl.Root defaultValue="day" aria-label="Range">
        {items({ onKeyDown, onClick })}
      </SegmentedControl.Root>,
    );

    // Act
    await user.click(screen.getByRole("radio", { name: "week" }));
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("radio", { name: "day" })).toHaveAttribute("aria-checked", "true");
  });

  it("re-attaches the root to a replacement ref when the ref prop changes", () => {
    // Arrange — the root's ref is composed with the controller's, and that
    // composition must follow a changed ref.
    const received: (HTMLDivElement | null)[] = [];

    // Act
    const { rerender } = render(
      <SegmentedControl.Root aria-label="Range" ref={() => {}}>
        {items()}
      </SegmentedControl.Root>,
    );
    rerender(
      <SegmentedControl.Root aria-label="Range" ref={(node) => void received.push(node)}>
        {items()}
      </SegmentedControl.Root>,
    );

    // Assert
    expect(received).toContain(screen.getByRole("radiogroup", { name: "Range" }));
  });
});
