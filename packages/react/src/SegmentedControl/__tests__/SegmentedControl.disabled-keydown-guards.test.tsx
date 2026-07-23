import { fireEvent, render, screen } from "@testing-library/react";

import { SegmentedControl } from "../SegmentedControl";

describe("SegmentedControl arrow-key guards for disabled focus", () => {
  it("does nothing when the focused segment is disabled but others are enabled", () => {
    // Arrange: `asChild` onto `<li>` so `disabled` doesn't stop the
    // element receiving the keydown the way a native `<button disabled>` would.
    const onValueChange = vi.fn();
    render(
      <SegmentedControl.Root aria-label="Mode" onValueChange={onValueChange}>
        <SegmentedControl.Item value="a" disabled asChild>
          <li>A</li>
        </SegmentedControl.Item>
        <SegmentedControl.Item value="b">B</SegmentedControl.Item>
        <SegmentedControl.Item value="c">C</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );
    const a = screen.getByRole("radio", { name: "A" });

    // Act: ArrowRight while focus is on a disabled segment
    fireEvent.keyDown(a, { key: "ArrowRight" });

    // Assert: nothing selected — the handler bailed on the
    // "focused item not in enabledValues" guard.
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "B" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("does nothing when the whole control is disabled (empty navigable set)", () => {
    // Arrange: group-disabled means no segment is navigable; without the
    // empty-navigable guard, arrowing would compute an undefined target.
    const onValueChange = vi.fn();
    render(
      <SegmentedControl.Root
        aria-label="Mode"
        disabled
        defaultValue="a"
        onValueChange={onValueChange}
      >
        <SegmentedControl.Item value="a" asChild>
          <li>A</li>
        </SegmentedControl.Item>
        <SegmentedControl.Item value="b" asChild>
          <li>B</li>
        </SegmentedControl.Item>
      </SegmentedControl.Root>,
    );
    const a = screen.getByRole("radio", { name: "A" });
    expect(a).toHaveAttribute("aria-checked", "true");

    // Act
    fireEvent.keyDown(a, { key: "ArrowRight" });

    // Assert: the pre-existing selection survives and no callback fires.
    expect(onValueChange).not.toHaveBeenCalled();
    expect(a).toHaveAttribute("aria-checked", "true");
  });
});
