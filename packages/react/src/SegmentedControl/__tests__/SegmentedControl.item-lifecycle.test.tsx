import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SegmentedControl } from "../SegmentedControl";

describe("SegmentedControl item lifecycle", () => {
  it("drops a removed segment from arrow-key navigation", async () => {
    // Arrange
    const user = userEvent.setup();
    const control = (withWeek: boolean) => (
      <SegmentedControl.Root defaultValue="day" aria-label="Range">
        <SegmentedControl.Item value="day">Day</SegmentedControl.Item>
        {withWeek && <SegmentedControl.Item value="week">Week</SegmentedControl.Item>}
        <SegmentedControl.Item value="month">Month</SegmentedControl.Item>
      </SegmentedControl.Root>
    );
    const { rerender } = render(control(true));
    rerender(control(false));
    screen.getByRole("radio", { name: "Day" }).focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(screen.getByRole("radio", { name: "Month" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "Month" })).toHaveAttribute("aria-checked", "true");
  });

  it("hands the tab stop on when the first segment is removed", () => {
    // Arrange
    const control = (withDay: boolean) => (
      <SegmentedControl.Root aria-label="Range">
        {withDay && <SegmentedControl.Item value="day">Day</SegmentedControl.Item>}
        <SegmentedControl.Item value="week">Week</SegmentedControl.Item>
      </SegmentedControl.Root>
    );
    const { rerender } = render(control(true));

    // Act
    rerender(control(false));

    // Assert
    expect(screen.getByRole("radio", { name: "Week" })).toHaveAttribute("tabindex", "0");
  });

  it("skips a segment that becomes disabled after mounting", async () => {
    // Arrange
    const user = userEvent.setup();
    const control = (weekDisabled: boolean) => (
      <SegmentedControl.Root defaultValue="day" aria-label="Range">
        <SegmentedControl.Item value="day">Day</SegmentedControl.Item>
        <SegmentedControl.Item value="week" disabled={weekDisabled}>
          Week
        </SegmentedControl.Item>
        <SegmentedControl.Item value="month">Month</SegmentedControl.Item>
      </SegmentedControl.Root>
    );
    const { rerender } = render(control(false));
    rerender(control(true));
    screen.getByRole("radio", { name: "Day" }).focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(screen.getByRole("radio", { name: "Month" })).toHaveAttribute("aria-checked", "true");
  });

  it("re-attaches a segment to a replacement ref when the ref prop changes", () => {
    // Arrange
    const received: (HTMLButtonElement | null)[] = [];
    const control = (ref: (node: HTMLButtonElement | null) => void) => (
      <SegmentedControl.Root aria-label="Range">
        <SegmentedControl.Item value="day" ref={ref}>
          Day
        </SegmentedControl.Item>
      </SegmentedControl.Root>
    );
    const { rerender } = render(control(() => {}));

    // Act
    rerender(control((node) => void received.push(node)));

    // Assert
    expect(received).toContain(screen.getByRole("radio", { name: "Day" }));
  });
});
