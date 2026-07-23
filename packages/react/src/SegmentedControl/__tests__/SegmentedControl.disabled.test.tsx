import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SegmentedControl } from "../SegmentedControl";

describe("SegmentedControl disabled — per item", () => {
  it("forwards the native disabled attribute and sets data-disabled on the segment", () => {
    // Arrange & Act
    render(
      <SegmentedControl.Root aria-label="Mode">
        <SegmentedControl.Item value="a">A</SegmentedControl.Item>
        <SegmentedControl.Item value="b" disabled>
          B
        </SegmentedControl.Item>
      </SegmentedControl.Root>,
    );
    const b = screen.getByRole("radio", { name: "B" });

    // Assert
    expect(b).toBeDisabled();
    expect(b).toHaveAttribute("data-disabled", "");
    expect(screen.getByRole("radio", { name: "A" })).not.toHaveAttribute(
      "data-disabled",
    );
  });

  it("skips a disabled segment when arrowing forwards", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <SegmentedControl.Root aria-label="Mode" defaultValue="a">
        <SegmentedControl.Item value="a">A</SegmentedControl.Item>
        <SegmentedControl.Item value="b" disabled>
          B
        </SegmentedControl.Item>
        <SegmentedControl.Item value="c">C</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );
    const a = screen.getByRole("radio", { name: "A" });
    const c = screen.getByRole("radio", { name: "C" });
    a.focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(c).toHaveFocus();
    expect(c).toHaveAttribute("aria-checked", "true");
  });

  it("skips a disabled segment when computing the home-base tab stop", () => {
    // Arrange & Act
    render(
      <SegmentedControl.Root aria-label="Mode">
        <SegmentedControl.Item value="a" disabled>
          A
        </SegmentedControl.Item>
        <SegmentedControl.Item value="b">B</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );

    // Assert: first enabled segment is the tab stop, not the disabled one
    expect(screen.getByRole("radio", { name: "A" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
    expect(screen.getByRole("radio", { name: "B" })).toHaveAttribute(
      "tabindex",
      "0",
    );
  });
});

describe("SegmentedControl disabled — whole control", () => {
  it("sets data-disabled on the root and disables every segment", () => {
    // Arrange & Act
    render(
      <SegmentedControl.Root aria-label="Mode" disabled defaultValue="a">
        <SegmentedControl.Item value="a">A</SegmentedControl.Item>
        <SegmentedControl.Item value="b">B</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );

    // Assert
    expect(screen.getByRole("radiogroup")).toHaveAttribute("data-disabled", "");
    const a = screen.getByRole("radio", { name: "A" });
    const b = screen.getByRole("radio", { name: "B" });
    expect(a).toBeDisabled();
    expect(a).toHaveAttribute("data-disabled", "");
    expect(b).toBeDisabled();
    expect(b).toHaveAttribute("data-disabled", "");
  });

  it("still reflects the selected segment while the control is disabled", () => {
    // Arrange & Act
    render(
      <SegmentedControl.Root aria-label="Mode" disabled defaultValue="a">
        <SegmentedControl.Item value="a">A</SegmentedControl.Item>
        <SegmentedControl.Item value="b">B</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );

    // Assert
    expect(screen.getByRole("radio", { name: "A" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("does not fire onValueChange when a disabled control's segment is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SegmentedControl.Root
        aria-label="Mode"
        disabled
        onValueChange={onValueChange}
      >
        <SegmentedControl.Item value="a">A</SegmentedControl.Item>
        <SegmentedControl.Item value="b">B</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );

    // Act
    await user.click(screen.getByRole("radio", { name: "B" }));

    // Assert
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("takes no segment into the tab sequence when disabled and nothing is selected", () => {
    // Arrange & Act
    render(
      <SegmentedControl.Root aria-label="Mode" disabled>
        <SegmentedControl.Item value="a">A</SegmentedControl.Item>
        <SegmentedControl.Item value="b">B</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );

    // Assert
    expect(screen.getByRole("radio", { name: "A" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
    expect(screen.getByRole("radio", { name: "B" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });
});
